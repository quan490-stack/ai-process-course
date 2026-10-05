import { lessons, cases, mapSteps, capstoneSections } from './content.js';
import { gradeLesson, gradeAttempt, defaultROI } from './engine.js';
import {practiceFields,ASSESSMENT_REVISION} from './rigor-content.js';
import {validPresentation} from './overhaul.js';
import {validFlow} from './learning-flow.js';
export const STORAGE_KEY='process-consultant:v1';
export const freshState=()=>({version:2,experience:{staticMotion:false,starter:{},classification:{answers:[]},conversation:{notes:{}}},assessments:{},assignments:{},consequences:{},legacy:{},lessons:{},cases:{},interviews:{},map:{},opportunity:{},failure:{},roi:{...defaultROI},capstone:{},notes:{},lastRoute:'dashboard'});
export function validateBackup(value) {
  if(!value||![1,2].includes(value.version)||typeof value!=='object'||Array.isArray(value))throw new Error('This is not a supported version 1 or 2 course backup.');
  const state=freshState();
  for(const k of ['lessons','cases','interviews','map','opportunity','failure','roi','capstone','notes','assessments','assignments','consequences','legacy']){
    if(value[k]!==undefined&&(!value[k]||typeof value[k]!=='object'||Array.isArray(value[k])))throw new Error(`Invalid backup section: ${k}`);
    state[k]={...state[k],...(value[k]||{})};
  }
  for(const [id,r]of Object.entries(state.lessons)){
    const lesson=lessons.find(l=>l.id===id);
    if(!lesson||!r||(!Array.isArray(r.answers)&&!Array.isArray(r.draft)))throw new Error('Invalid lesson evidence.');
    for(const arr of [r.answers,r.draft,r.lastAnswers])if(arr&&(!Array.isArray(arr)||arr.length>lesson.questions.length||arr.some(v=>!['string','number'].includes(typeof v))))throw new Error('Invalid lesson answers.');
    if(value.version===2)state.lessons[id]={...r,score:Array.isArray(r.answers)?gradeLesson(lesson,r.answers).score:undefined,latestScore:Array.isArray(r.lastAnswers)?gradeLesson(lesson,r.lastAnswers).score:undefined};
  }
  for(const [id,i] of Object.entries(state.interviews)){
    const c=cases.find(c=>c.id===id);
    if(!c||!i||!Array.isArray(i.asked))throw new Error('Invalid interview evidence.');
    state.interviews[id]={asked:[...new Set(i.asked.filter(q=>c.questions.some(x=>x.id===q)))]};
  }
  for(const [id,d]of Object.entries(state.cases))if(!cases.some(c=>c.id===id)||!d||typeof d!=='object'||Array.isArray(d))throw new Error('Invalid case evidence.');
  for(const [id,n]of Object.entries(state.notes))if(typeof n!=='string')throw new Error('Invalid note text.');
  for(const [id,v]of Object.entries(state.capstone))if(!['string','boolean','number'].includes(typeof v))throw new Error('Invalid capstone field.');
  for(const id of [...capstoneSections.map(([id])=>id),'agentRole','agentOutput'])if(state.capstone[id]!==undefined&&typeof state.capstone[id]!=='string')throw new Error('Invalid capstone narrative.');
  if(state.map.order&&(!Array.isArray(state.map.order)||state.map.order.length!==7||new Set(state.map.order).size!==7||state.map.order.some(s=>!mapSteps.includes(s))))throw new Error('Invalid map order.');
  if(state.map.owners&&(!state.map.owners||typeof state.map.owners!=='object'||Array.isArray(state.map.owners)))throw new Error('Invalid map ownership.');
  state.lastRoute=typeof value.lastRoute==='string'?value.lastRoute:'dashboard';
  if(value.experience!==undefined){
    const x=value.experience;
    if(!x||typeof x!=='object'||Array.isArray(x))throw new Error('Invalid experience settings.');
    if(x.staticMotion!==undefined&&typeof x.staticMotion!=='boolean')throw new Error('Invalid motion preference.');
    if(x.presentation!==undefined&&!validPresentation(x.presentation))throw new Error('Invalid lesson presentation state.');
    if(x.flow!==undefined&&!validFlow(x.flow))throw new Error('Invalid learning flow state.');
    if(x.visuals!==undefined){
      if(!x.visuals||typeof x.visuals!=='object'||Array.isArray(x.visuals))throw new Error('Invalid visual practice.');
      const allowed={solar:{intake:['complete','missing'],calculation:['rules','ai'],approval:['yes','no']},connections:{api:['yes','no'],event:['webhook','poll']},knowledge:{source:['approved','stale','missing']},agents:{tools:['read','write'],approval:['yes','no']}};
      for(const [kind,data]of Object.entries(x.visuals)){
        if(!allowed[kind]||!data||typeof data!=='object'||Array.isArray(data)||Object.entries(data).some(([k,v])=>!allowed[kind][k]?.includes(v)))throw new Error('Invalid visual condition.');
      }
    }
    for(const key of ['starter','classification','conversation'])if(x[key]!==undefined&&(!x[key]||typeof x[key]!=='object'||Array.isArray(x[key])))throw new Error('Invalid guided practice.');
    for(const unit of Object.values(x.starter||{}))if(!unit||typeof unit!=='object'||Array.isArray(unit)||(unit.submitted!==undefined&&typeof unit.submitted!=='boolean')||(unit.answer!==undefined&&!['0','1','2'].includes(String(unit.answer))))throw new Error('Invalid introductory answer.');
    if(x.classification?.answers!==undefined&&(!Array.isArray(x.classification.answers)||x.classification.answers.length>7||x.classification.answers.some(a=>a!==null&&!['','human','rules','automation','ai','ai-decision','system','approval'].includes(a))))throw new Error('Invalid classification practice.');
    for(const d of [x.classification,x.conversation])if(d?.submitted!==undefined&&typeof d.submitted!=='boolean')throw new Error('Invalid practice status.');
    if(x.conversation?.topic!==undefined&&!/^(?:[0-9]|10)$/.test(String(x.conversation.topic)))throw new Error('Invalid conversation topic.');
    if(x.conversation?.answer!==undefined&&!['','0','1'].includes(x.conversation.answer))throw new Error('Invalid conversation answer.');
    if(x.conversation?.notes!==undefined&&(!x.conversation.notes||typeof x.conversation.notes!=='object'||Object.values(x.conversation.notes).some(n=>typeof n!=='string')))throw new Error('Invalid conversation draft.');
    state.experience={...state.experience,...x,starter:{...(x.starter||{})},classification:{...(x.classification||{}),answers:(x.classification?.answers||[]).map(a=>a??'')},conversation:{notes:{},...(x.conversation||{})}};
  }
  validateNewEvidence(state);
  return value.version===1?migrateLegacy(state):state;
}
export function loadProgress(storage) {
  try {storage??=globalThis.localStorage;const raw=storage.getItem(STORAGE_KEY);return {state:raw?validateBackup(JSON.parse(raw)):freshState(),error:null};}
  catch {return {state:freshState(),error:'Saved progress could not be read. Export any available backup before replacing it. Your session can continue, but use a JSON backup to keep your work.'};}
}
export function saveProgress(state,storage) {
  try {storage??=globalThis.localStorage;storage.setItem(STORAGE_KEY,JSON.stringify(state));return null;}catch{return 'Local saving failed. Keep this tab open and export a JSON backup to preserve your work.';}
}

const legacyAnswers={fit:[1,1,0],reliability:[1,0,1],discovery:[1,1,1],diagnosis:[1,0,1],current:[1,1,1],future:[1,1,1],value:[1,1,1],delivery:[1,1,1]};
function migrateLegacy(state){
  state.legacy={revision:'1.0',lessons:structuredClone(state.lessons),cases:structuredClone(state.cases),map:structuredClone(state.map),opportunity:structuredClone(state.opportunity),failure:structuredClone(state.failure),capstone:structuredClone(state.capstone)};
  for(const [id,r]of Object.entries(state.lessons)){
    const expected=legacyAnswers[id];
    const score=Array.isArray(r.answers)?Math.round(expected.filter((answer,i)=>String(r.answers[i])===String(answer)).length/expected.length*100):undefined;
    state.legacy.lessons[id].score=score;
    state.lessons[id]={draft:[],legacyScore:score};
  }
  for(const [id,d]of Object.entries(state.cases))state.cases[id]={notes:d.notes||'',legacySubmitted:!!d.submitted};
  for(const key of ['map','opportunity','failure','capstone'])state[key].submitted=false;
  state.assessments={};state.assignments={};state.consequences={};
  return state;
}

function validateNewEvidence(state){
  const keys=new Set(['map','opportunity','failure','capstone',...lessons.flatMap(l=>['lesson:'+l.id,'assignment:'+l.id]),...cases.map(c=>'case:'+c.id)]);
  for(const [id,d]of Object.entries(state.assignments)){
    if(!lessons.some(l=>l.id===id)||!d||typeof d!=='object'||Array.isArray(d))throw new Error('Invalid practical assignment.');
    for(const field of practiceFields)if(d[field.id]!==undefined&&typeof d[field.id]!=='string')throw new Error('Invalid written assignment field.');
    if(d.decisions&&!Array.isArray(d.decisions))throw new Error('Invalid assignment decisions.');
  }
  for(const [key,record]of Object.entries(state.assessments)){
    if(!keys.has(key)||!record||!Array.isArray(record.history)||record.history.length>1000)throw new Error('Invalid assessment history.');
    for(const attempt of record.history){
      if(!attempt||typeof attempt.revision!=='string'||!attempt.payload||typeof attempt.payload!=='object'||Array.isArray(attempt.payload)||!attempt.context||typeof attempt.context!=='object'||Array.isArray(attempt.context))throw new Error('Invalid attempt snapshot.');
      if(key.startsWith('lesson:')&&!Array.isArray(attempt.payload.answers))throw new Error('Invalid lesson attempt.');
      if(attempt.context.asked&&!Array.isArray(attempt.context.asked))throw new Error('Invalid discovery context.');
      if(attempt.context.solarAsked&&!Array.isArray(attempt.context.solarAsked))throw new Error('Invalid capstone discovery context.');
      if(attempt.revision===ASSESSMENT_REVISION){
        const result=gradeAttempt(key,attempt);
        if(!Number.isFinite(result.score))throw new Error('Invalid evaluated attempt.');
      }
    }
  }
  for(const [id,incidents]of Object.entries(state.consequences)){
    if(!cases.some(c=>c.id===id)||!Array.isArray(incidents))throw new Error('Invalid consequence history.');
    for(const incident of incidents){
      const q=cases.find(c=>c.id===id).assessed.find(q=>q.id===incident?.field);
      if(!q||!q.choices.some(c=>c.value===String(incident.selected))||!Array.isArray(incident.history))throw new Error('Invalid consequence evidence.');
      incident.recovered=incident.history.some(entry=>entry?.answer==='repair');
    }
  }
}
