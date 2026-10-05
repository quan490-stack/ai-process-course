import {capstoneDecisions} from './capstone-decisions.js';
import {ownershipDecisionFeedback} from './guided-feedback.js';
import {labDecisions} from './lab-decisions.js';
import { lessons, cases, skills, mapSteps, capstoneSections } from './content.js';
import {practiceAssessments,practiceFields} from './rigor-content.js';
import {summarizeAttempts} from './evidence.js';
import {consequenceDecision} from './case-assessments.js';
export const PASS = 75;
export const clamp = (n,min=0,max=100) => Math.max(min,Math.min(max,n));
const answerIndex=value=>(typeof value==='number'||typeof value==='string')&&value!==''&&Number.isInteger(Number(value))?Number(value):-1;
export function gradeLesson(lesson, answers) {
  const correct = lesson.questions.filter((q,i)=>answerIndex(answers?.[i])===q.correct).length;
  const score=Math.round(correct/lesson.questions.length*100);
  return {score,passed:score>=PASS,feedback:lesson.questions.map((q,i)=>decisionFeedback(q,answers?.[i]))};
}
export function decisionFeedback(question,selected,byValue=false){
  const index=byValue?question.choices.findIndex(c=>c.value===String(selected)):answerIndex(selected);
  const chosen=question.choices[index],preferred=question.choices[question.correct];
  return {prompt:question.prompt,correct:index===question.correct,selected:chosen?.text||'No decision submitted',rationale:chosen?.rationale||'A decision is needed before its reasoning can be assessed.',evidence:question.evidence,consequence:chosen?.consequence||'The business still lacks a justified recommendation.',preferred:preferred.text+' '+preferred.rationale,alternative:chosen?.when||'Gather the missing evidence before selecting an approach.',lens:question.lens,text:question.why};
}
export function gradePractice(lessonId,d={}){
  const questions=practiceAssessments[lessonId];
  const missing=practiceFields.filter(f=>typeof d[f.id]!=='string'||d[f.id].trim().length<f.min).map(f=>f.label);
  const assessed=gradeLesson({questions},d.decisions||[]);
  return {...assessed,score:missing.length?0:assessed.score,structuredScore:assessed.score,passed:assessed.passed&&missing.length===0,complete:missing.length===0,missing,semanticStatus:'Not evaluated',checks:[['Required evidence fields',0,missing.length===0,'Completeness only; prose quality is not inferred from length or keywords.'],...questions.map((q,i)=>[q.prompt,50,assessed.feedback[i].correct,q.why])]};
}
export function roi(input) {
  const required = ['frequency','current','future','hourly','implementation','training','software','maintenance','api','realization','errors'];
  const errors = {};
  for (const k of required) if (input[k] === '' || input[k] == null || !Number.isFinite(Number(input[k])) || Number(input[k]) < 0 || Number(input[k]) > 1e9) errors[k]='Enter a finite, nonnegative number (up to 1 billion).';
  if (Number(input.realization)>100) errors.realization='Use 0–100%.';
  if(Object.keys(errors).length) return {valid:false,errors};
  const v=Object.fromEntries(required.map(k=>[k,Number(input[k])]));
  const currentCost=v.frequency*v.current/60*v.hourly;
  const futureCost=v.frequency*v.future/60*v.hourly;
  const hours=v.frequency*(v.current-v.future)/60;
  const capacity=(currentCost-futureCost)*v.realization/100;
  const recurring=v.software+v.maintenance+v.api;
  const net=capacity+v.errors-recurring;
  const upfront=v.implementation+v.training;
  const annual=net*12;
  return {valid:true,currentCost,futureCost,hours,capacity,recurring,net,annual,upfront,payback:net>0?upfront/net:null,yearOne:upfront>0?(annual-upfront)/upfront*100:null};
}
export const defaultROI = {frequency:90,current:45,future:20,hourly:35,implementation:3200,training:400,software:50,maintenance:30,api:0,realization:75,errors:0};
export function gradeCase(c,d,asked=[]) {
  const discovered = new Set(asked.filter(id=>c.questions.some(q=>q.id===id)));
  const checks = [
    ['Discovery',20,discovered.size===7,'Interview all three roles and gather process, time, exception, success and risk evidence.'],
    ['Root cause',20,String(d.root)===String(c.root),'Diagnose the input, ownership or document problem supported by evidence.'],
    ['Proportionate solution',15,String(d.solution)===String(c.solution),'Select scope that addresses the observed cause without carrying unnecessary uncertainty.'],
    ['Approval',10,d.approval==='review','Retain the named authorized reviewer before a binding action.'],
    ['Exceptions',10,d.exception==='queue','Block missing or uncertain inputs and route them to a named owner.'],
    ['Measurement',10,d.metric==='baseline','Compare baseline and pilot time, quality and adoption.'],
    ['Business case',5,d.economics==='capacity','Use net realized capacity, including review and recurring costs.'],
    ['Verification',5,d.verify==='sample','Test the cause on a representative transaction mix, not only platform capability.'],
    ['Architecture defense',5,d.defense==='separate','Defend the boundary between stable rules, ambiguous inputs and consequential actions.']
  ];
  const score=checks.reduce((s,[,w,ok])=>s+(ok?w:0),0);
  const safety=d.approval==='review'&&d.exception==='queue'&&String(d.solution)===String(c.solution);
  const enoughDiscovery=discovered.size>=5&&['systems','time','exceptions','risk'].every(id=>discovered.has(id));
  return {score,passed:score>=PASS&&safety&&enoughDiscovery&&String(d.root)===String(c.root)&&d.verify==='sample'&&d.defense==='separate',safety,checks,feedback:c.assessed.map(q=>decisionFeedback(q,d[q.id],true)),discovery:Math.round(discovered.size/7*100),risk:safety?100:0};
}
export function newConsequence(client,d){
  const wrong=client.assessed.find(q=>!decisionFeedback(q,d[q.id],true).correct);
  if(!wrong)return null;
  const incident=consequenceDecision(client,wrong.id,d[wrong.id]);
  return incident?{field:incident.field,selected:incident.selected,incident:incident.incident,answer:'',history:[],recovered:false}:null;
}
export function gradeConsequence(client,incident,answer){
  const data=consequenceDecision(client,incident.field,incident.selected);
  const result=decisionFeedback(data.question,answer,true);
  return {score:result.correct?100:0,passed:result.correct,feedback:[result],checks:[['Recovery diagnosis',100,result.correct,'Correct the failed boundary before expanding the same workflow.']]};
}
export const expectedOwners=['Project manager','Buyer','Buyer','Approved rules','Material reviewer','Authorized buyer','Coordinator'];
export function gradeMap(d) {
  const order=Array.isArray(d.order)?d.order:[];
  const complete=order.length===7&&new Set(order).size===7&&mapSteps.every(s=>order.includes(s));
  const dependencies=[[0,1],[0,2],[1,3],[2,3],[3,4],[4,5],[5,6]];
  const position=complete?dependencies.filter(([a,b])=>order.indexOf(mapSteps[a])<order.indexOf(mapSteps[b])).length:0;
  const owners=mapSteps.filter((s,i)=>d.owners?.[s]===expectedOwners[i]).length;
  const orderScore=position/7*40, ownerScore=owners/7*30;
  const exception=d.exception==='block', approval=d.approval==='before';
  const score=Math.round(orderScore+ownerScore+(exception?15:0)+(approval?15:0));
  const criticalOwners=[3,4,5].every(i=>d.owners?.[mapSteps[i]]===expectedOwners[i]);
  const ownershipFeedback=mapSteps.map((step,i)=>ownershipDecisionFeedback(step,d.owners?.[step],expectedOwners[i]));
  return {feedback:[...labDecisions.map.map(q=>decisionFeedback(q,d[q.id],true)),...ownershipFeedback],score,passed:score>=PASS&&complete&&position===7&&criticalOwners&&exception&&approval,checks:[['Sequence',40,position===7,'Gather approved inputs before calculating; review before ordering; track delivery afterward. All sequence dependencies are mandatory.'],['Ownership',30,owners===7,'Approved rules calculate; material reviewer approves; authorized buyer releases. These three ownership boundaries are mandatory.'],['Missing inputs',15,exception,'Block incomplete inputs and return to project manager.'],['Approval gate',15,approval,'Require approval before a PO is released, and again after revisions.']]};
}
export function opportunity(v={}) {
  const names=['frequency','labor','cost','repetition','error','standard','data','judgment','risk','exceptions','complexity','return'];
  const n=k=>clamp(Number(v[k])||1,1,5);
  const value=Math.round((n('frequency')+n('labor')+n('cost')+n('error')+n('return'))/25*100);
  const feasibility=Math.round((n('repetition')+n('standard')+n('data')+(6-n('judgment'))+(6-n('risk'))+(6-n('exceptions'))+(6-n('complexity')))/35*100);
  const blocked=n('risk')>=4||n('data')<=2;
  return {value,feasibility,blocked,quadrant:`${value>=60?'High':'Low'} value / ${feasibility>=60?'low':'high'} complexity`,priority:blocked?'Resolve risk or data gaps before a pilot':value>=60&&feasibility>=60?'Candidate quick win':value>=60?'Stage discovery and a bounded prototype':feasibility>=60?'Small improvement if effort is justified':'Defer; compare a process change',names};
}
export function gradeOpportunity(d) {
  const checks=[['Technology fit',40,d.approach==='form','A form, shared Sheet and rule-based notification solve missing intake; agents add no material benefit.'],['Pilot scope',30,d.pilot==='small','Pilot one workflow with two users and acceptance criteria.'],['Risk gate',30,d.gate==='review','Resolve high risk or missing data before automatic actions.']];
  return {feedback:labDecisions.opportunity.map(q=>decisionFeedback(q,d[q.id],true)),score:checks.reduce((s,[,w,ok])=>s+(ok?w:0),0),checks};
}
export function gradeFailure(d) {
  const checks=[['Cause',35,d.cause==='retry','Repeated webhook events create duplicates when there is no idempotent transaction ID.'],['Recovery',30,d.recovery==='reconcile','Pause automatic writes, reconcile records with an owner and use a manual fallback.'],['Prevention',35,d.prevention==='id','Use a unique event/job ID, idempotent upsert, bounded retries and alerting.']];
  return {feedback:labDecisions.failure.map(q=>decisionFeedback(q,d[q.id],true)),score:checks.reduce((s,[,w,ok])=>s+(ok?w:0),0),checks};
}
export function gradeCapstone(d,state) {
  const narrativeCount=capstoneSections.filter(([id])=>(d[id]||'').trim().length>=80).length;
  const solar=cases.find(c=>c.id==='solar');
  const caseResult=gradeCase(solar,state.cases.solar||{},state.interviews.solar?.asked||[]);
  const mapping=gradeMap(state.map||{});
  const financial=roi(state.roi||{});
  const safe=d.control==='review'&&d.data==='least'&&d.exception==='block';
  const agentSafe=d.agentTools==='read'&&d.agentApproval==='human'&&d.agentFailure==='stop';
  const checks=[
    ['Written deliverables',0,narrativeCount===15,`${narrativeCount}/15 sections contain at least 80 characters. Required completeness only; writing receives no semantic competency points.`],
    ['Discovery evidence',10,caseResult.discovery===100,'Interview the solar owner, buyer and reviewer; collect all seven evidence topics.'],
    ['Workflow evidence',10,mapping.passed,'Pass the procurement workflow lab with sequence, ownership and approval controls.'],
    ['Diagnosis',10,String(d.root)==='1','Incomplete intake and unversioned calculation rules explain the observed errors.'],
    ['Architecture',10,d.architecture==='rules','Choose validated intake, deterministic quantities, version checks and human PO approval.'],
    ['Governance',10,safe,'Restrict access, block missing inputs, and keep human authorization.'],
    ['ROI reasoning',10,financial.valid&&d.economics==='capacity'&&d.sensitivity==='downside','Save valid ROI assumptions, distinguish capacity from cash and test lower adoption/higher cost.'],
    ['Implementation',10,d.rollout==='pilot'&&d.fallback==='manual','Pilot with measurable acceptance and a named manual rollback route.'],
    ['Communication',5,d.message==='outcome','Explain fewer shortages and reliable orders before technical features.'],
    ['Bounded agent design',10,agentSafe&&(d.agentRole||'').trim().length>=40&&(d.agentOutput||'').trim().length>=40,'Specify role/objective/input, read-only tools, forbidden purchases, human approval, structured output and stop/escalate behavior.']
  ];
  const score=Math.round(checks.reduce((s,[,w,ok])=>s+(ok?w:0),0)/85*100);
  return {feedback:[decisionFeedback(solar.assessed.find(q=>q.id==='root'),d.root,true),...capstoneDecisions.map(q=>decisionFeedback(q,d[q.id],true))],score,safe,passed:score>=80&&safe&&agentSafe&&String(d.root)==='1'&&d.architecture==='rules'&&narrativeCount===15&&caseResult.discovery===100&&mapping.passed,checks,narrativeCount,agent:checks.at(-1)[2]?100:0,risk:safe?100:0};
}

export function gradeAttempt(key,attempt){
  const [kind,id]=key.split(':'),d=attempt.payload||{},ctx=attempt.context||{};
  if(kind==='lesson')return gradeLesson(lessons.find(l=>l.id===id),d.answers);
  if(kind==='assignment')return gradePractice(id,d);
  if(kind==='case')return gradeCase(cases.find(c=>c.id===id),d,ctx.asked||[]);
  if(kind==='map')return gradeMap(d);
  if(kind==='opportunity')return gradeOpportunity(d);
  if(kind==='failure')return gradeFailure(d);
  if(kind==='capstone')return gradeCapstone(d,{cases:{solar:ctx.solarDraft||{}},interviews:{solar:{asked:ctx.solarAsked||[]}},map:ctx.map||{},roi:ctx.roi||{}});
  throw new Error('Unknown assessment key.');
}
export const assessmentSummary=(state,key)=>summarizeAttempts(state.assessments?.[key],a=>gradeAttempt(key,a));
export function lessonMastered(state,id){return assessmentSummary(state,'lesson:'+id).bestPassed&&assessmentSummary(state,'assignment:'+id).bestPassed;}
export function caseMastered(state,id){return assessmentSummary(state,'case:'+id).bestPassed&&!(state.consequences?.[id]||[]).some(x=>!x.recovered);}

export function competency(state){
  const evidence=Object.fromEntries(skills.map(s=>[s,[]]));
  const add=(key,names,source,selector=r=>r.score)=>{
    const summary=assessmentSummary(state,key);if(!summary.assessed)return;
    const first=selector(summary.first),latest=selector(summary.latest);
    for(const name of names)evidence[name].push({key,source,first,latest,score:Math.round((first+latest)/2),attempts:summary.count});
  };
  for(const l of lessons){add('lesson:'+l.id,l.skill,l.title);add('assignment:'+l.id,l.id==='reliability'?[...l.skill,'Agent Design']:l.skill,l.title+' · applied work');}
  for(const c of cases){
    add('case:'+c.id,['Discovery'],c.name,r=>r.discovery);
    const component=(r,names)=>{const checks=r.checks.filter(([label])=>names.includes(label));return Math.round(checks.reduce((sum,[,weight,ok])=>sum+(ok?weight:0),0)/checks.reduce((sum,[,weight])=>sum+weight,0)*100);};
    add('case:'+c.id,['Business Process Analysis'],c.name,r=>component(r,['Root cause','Verification']));
    add('case:'+c.id,['Solution Architecture'],c.name,r=>component(r,['Proportionate solution','Architecture defense']));
    add('case:'+c.id,['ROI Analysis'],c.name,r=>component(r,['Business case']));
    add('case:'+c.id,['Consulting Communication'],c.name+' · structured defense',r=>component(r,['Architecture defense']));
    add('case:'+c.id,['Risk & Governance'],c.name,r=>r.risk);
  }
  add('map',['Workflow Mapping'],'Workflow lab');
  add('opportunity',['Solution Architecture','Business Process Analysis'],'Opportunity lab');
  add('failure',['Automation Design','Implementation Planning'],'Failure recovery');
  const cap=assessmentSummary(state,'capstone');
  if(cap.assessed){
    const component=(r,name)=>r.checks.find(([label])=>label===name)?.[2]?100:0;
    const components={'AI Knowledge':'Architecture','Business Process Analysis':'Diagnosis','Discovery':'Discovery evidence','Workflow Mapping':'Workflow evidence','Solution Architecture':'Architecture','Automation Design':'Architecture','ROI Analysis':'ROI reasoning','Consulting Communication':'Communication','Implementation Planning':'Implementation'};
    for(const [skill,componentName]of Object.entries(components))add('capstone',[skill],'Capstone',r=>component(r,componentName));
    add('capstone',['Agent Design'],'Capstone',r=>r.agent);
    add('capstone',['Risk & Governance'],'Capstone',r=>r.risk);
  }
  return skills.map(name=>({name,score:evidence[name].length?Math.round(evidence[name].reduce((s,e)=>s+e.score,0)/evidence[name].length):null,evidence:evidence[name],assessed:!!evidence[name].length}));
}
export function readiness(state){
  const scores=competency(state),assessed=scores.filter(s=>s.assessed);
  const latestSafety=cases.every(c=>{const s=assessmentSummary(state,'case:'+c.id);return s.assessed&&s.latest.passed;})&&assessmentSummary(state,'capstone').latest?.passed;
  const gates=[
    ['Eight lesson decisions and eight applied assignments',lessons.every(l=>lessonMastered(state,l.id))],
    ['Four defended client engagements and recovered consequences',cases.every(c=>caseMastered(state,c.id))],
    ['Workflow lab',assessmentSummary(state,'map').bestPassed],
    ['Opportunity lab',assessmentSummary(state,'opportunity').bestPassed],
    ['Failure recovery',assessmentSummary(state,'failure').bestPassed],
    ['Capstone ≥80 with current safety gates',assessmentSummary(state,'capstone').bestPassed&&!!latestSafety],
    ['All competencies assessed, ≥70; governance ≥75',scores.every(s=>s.assessed&&s.score>=(s.name==='Risk & Governance'?75:70))]
  ];
  return {ready:gates.every(([,ok])=>ok),gates,scores,overall:assessed.length?Math.round(assessed.reduce((s,x)=>s+x.score,0)/assessed.length):null,assessedCount:assessed.length,evidenceCount:new Set(assessed.flatMap(s=>s.evidence.map(e=>e.key))).size};
}
