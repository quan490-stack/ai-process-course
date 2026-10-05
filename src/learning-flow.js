import {validVideoProgress} from './video-recaps.js';
import {validRecaps} from './recaps.js';
import {starterUnits} from './beginner.js';
import {lessons,cases} from './content.js';
import {lessonMastered,caseMastered,gradeMap,gradeOpportunity,gradeFailure,gradeCapstone} from './engine.js';
export const guidedStages=['Understand','See it in business','Try it','Review the outcome','Complete'];
export const programRoutes=[...starterUnits.map(u=>'start:'+u.id),'start:practice',...lessons.map(l=>'lesson:'+l.id),'case:hvac','map','case:restaurant','case:bookkeeping','case:solar','opportunity','roi','failure','capstone','scores'];
export function flowState(state){return state.experience.flow||={guided:{},reviews:{},decisions:{},activities:{}};}
export function nextProgramRoute(route){const i=programRoutes.indexOf(route==='start'?'start:useful':route);return programRoutes[Math.min(i+1,programRoutes.length-1)]||'start';}
export function routeTitle(route){const [page,id]=route.split(':');return page==='lesson'?lessons.find(l=>l.id===id)?.title:page==='case'?cases.find(c=>c.id===id)?.name:page==='start'?starterUnits.find(u=>u.id===id)?.title||'Put the building blocks together':({map:'Design a controlled workflow',opportunity:'Diagnose the right opportunity',roi:'Build an honest business case',failure:'Contain, recover and prevent failure',capstone:'Defend an end-to-end client solution',scores:'Review your client-readiness evidence'})[page]||'Continue your consulting practice';}
export function activityComplete(state,route){
 const [page,id]=route.split(':');if(page==='lesson')return lessonMastered(state,id);
 if(page==='case')return caseMastered(state,id);
 if(page==='map')return Boolean(state.map.submitted&&gradeMap(state.map).passed);
 if(page==='opportunity')return Boolean(state.opportunity.submitted&&gradeOpportunity(state.opportunity).score>=75);
 if(page==='failure')return Boolean(state.failure.submitted&&gradeFailure(state.failure).score>=75);
 if(page==='capstone')return Boolean(state.capstone.submitted&&gradeCapstone(state.capstone,state).passed);
 return route==='roi';
}
export function validFlow(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const validScope=scope=>{const [base,suffix,...rest]=scope.split('@');if(rest.length||suffix!==undefined&&!/^[1-9][0-9]?$/.test(suffix))return false;return programRoutes.includes(base)||base==='classification'||/^conversation:(?:[0-9]|10)$/.test(base)||['capstone:stage','capstone:decisions','map:studio'].includes(base)||cases.some(c=>base==='consequence:'+c.id||base==='interview:'+c.id)||starterUnits.some(u=>base==='starter:'+u.id)||lessons.some(l=>base==='assignment:'+l.id);};
 return Object.entries(value).every(([group,entries])=>(group==='videoRecaps'?validVideoProgress(entries):group==='recaps'?validRecaps(entries):['guided','reviews','decisions','activities'].includes(group))&&entries&&typeof entries==='object'&&!Array.isArray(entries)&&(['recaps','videoRecaps'].includes(group)||Object.entries(entries).every(([id,v])=>group==='guided'?starterUnits.some(u=>u.id===id)&&Number.isInteger(v)&&v>=0&&v<5:!validScope(id)?false:group==='reviews'?v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>['question','phase'].includes(k))&&Number.isInteger(v.question)&&v.question>=0&&v.question<64&&Number.isInteger(v.phase)&&v.phase>=0&&v.phase<5:group==='decisions'?Number.isInteger(v)&&v>=0&&v<64:['work','review','complete'].includes(v))));
}
