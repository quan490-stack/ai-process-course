import {ASSESSMENT_REVISION} from './rigor-content.js';

export function recordAttempt(state,key,payload,context={}) {
  state.assessments ||= {};
  const record=state.assessments[key] ||= {history:[]};
  record.history.push({revision:ASSESSMENT_REVISION,at:new Date().toISOString(),payload:structuredClone(payload),context:structuredClone(context)});
  return record.history.at(-1);
}

export function summarizeAttempts(record,evaluate) {
  const attempts=(record?.history||[]).filter(a=>a.revision===ASSESSMENT_REVISION);
  if(!attempts.length)return {assessed:false,count:0,first:null,latest:null,best:null,bestPassed:false,evidenceScore:null};
  const results=attempts.map(evaluate);
  const first=results[0],latest=results.at(-1);
  return {assessed:true,count:results.length,first,latest,best:Math.max(...results.map(r=>r.score)),bestPassed:results.some(r=>r.passed??r.score>=75),evidenceScore:Math.round((first.score+latest.score)/2),history:results};
}
