import {freshState,saveProgress} from './storage.js';
import {lessons,mapSteps,cases} from './content.js';
import {starterUnits} from './beginner.js';
import {lessonMastered} from './engine.js';

const meaningful=value=>Array.isArray(value)?value.some(meaningful):value&&typeof value==='object'?Object.values(value).some(meaningful):typeof value==='string'?value.trim().length>0:typeof value==='number'||value===true;
export function hasLearnerProgress(state){
 if(['assessments','lessons','assignments','cases','interviews','consequences','legacy','capstone','notes','failure','opportunity'].some(k=>meaningful(state[k])))return true;
 const x=state.experience||{};
 if(meaningful(x.starter)||meaningful(x.classification)||meaningful(x.conversation)||meaningful(x.visuals))return true;
 if(Object.values(x.presentation||{}).some(p=>p.stage>0))return true;
 if(Object.values(x.flow?.guided||{}).some(stage=>stage>0)||Object.values(x.flow?.decisions||{}).some(index=>index>0))return true;
 if(meaningful(state.map?.owners)||state.map?.exception||state.map?.approval||state.map?.submitted)return true;
 const initial=[0,2,1,4,3,6,5].map(i=>mapSteps[i]);if(state.map?.order&&JSON.stringify(state.map.order)!==JSON.stringify(initial))return true;
 const baseline=freshState().roi;return Object.entries(state.roi||{}).some(([k,v])=>String(v)!==String(baseline[k]));
}
export function resumeCourseRoute(state){
 const route=state.lastRoute||'';
 if(isLearningRoute(route))return route;
 const next=lessons.find(l=>!lessonMastered(state,l.id));return hasLearnerProgress(state)?(next?'lesson:'+next.id:'capstone'):'start';
}
export function isLearningRoute(route){
 const [page,id,...extra]=route.split(':');if(extra.length)return false;
 if(['map','opportunity','roi','failure','capstone'].includes(page))return !id;
 if(page==='lesson')return lessons.some(l=>l.id===id);
 if(page==='case')return cases.some(c=>c.id===id);
 return page==='start'&&(!id||id==='practice'||starterUnits.some(u=>u.id===id));
}
export function freshLearnerState(previous){
 const clean=freshState();clean.lastRoute='start';
 // Only interface preferences survive. Guided exercises and presentation position are learner data.
 for(const key of ['staticMotion','reducedMotion','accessibility','theme','display'])if(previous.experience?.[key]!==undefined)clean.experience[key]=structuredClone(previous.experience[key]);
 return clean;
}
export function restartedLessonState(previous,id){
 if(id.startsWith('start:')){
  const unit=id.slice(6);if(!starterUnits.some(u=>u.id===unit))throw new Error('Unknown lesson.');
  const next=structuredClone(previous);delete next.experience.starter[unit];
  if(next.experience.flow){delete next.experience.flow.guided?.[unit];delete next.experience.flow.reviews?.['starter:'+unit];delete next.experience.flow.decisions?.['starter:'+unit];}
  next.lastRoute=id;return next;
 }
 if(!lessons.some(l=>l.id===id))throw new Error('Unknown lesson.');
 const next=structuredClone(previous);delete next.lessons[id];delete next.assignments[id];delete next.notes[id];delete next.assessments['lesson:'+id];delete next.assessments['assignment:'+id];
 if(next.experience.presentation)delete next.experience.presentation[id];
 delete next.experience.flow?.recaps?.[id];
 delete next.experience.flow?.videoRecaps?.[id];
 if(next.experience.flow){for(const group of ['reviews','decisions','activities'])for(const key of Object.keys(next.experience.flow[group]||{}))if(key==='lesson:'+id||key==='assignment:'+id||key.startsWith('lesson:'+id+'@')||key.startsWith('assignment:'+id+'@'))delete next.experience.flow[group][key];}
 if(id==='fit'&&next.experience.visuals)delete next.experience.visuals.solar;
 for(const key of ['lessons','assignments'])if(next.legacy[key])delete next.legacy[key][id];
 next.lastRoute='lesson:'+id;return next;
}
export function persistSessionReset(previous,{lessonId,storage}={}){
 const state=lessonId?restartedLessonState(previous,lessonId):freshLearnerState(previous);
 const error=saveProgress(state,storage);return {state:error?previous:state,error};
}
export function sessionEntry(state){
 const returning=hasLearnerProgress(state),done=lessons.filter(l=>lessonMastered(state,l.id)).length;
 return '<section class="session-entry"><div class="entry-copy"><p class="eyebrow">AI BUSINESS PROCESS CONSULTANT</p><h1>'+(returning?'Welcome back.<br>Your next idea awaits.':'Understand the work.<br>Design a better business.')+'</h1><p>'+(returning?'Your decisions, practical work and first-attempt evidence are saved on this device. Choose how you want to begin today.':'Go from knowing almost nothing about AI to making clear, reliable consulting recommendations. One visual idea. One business decision at a time.')+'</p><div class="entry-actions"><button type="button" class="button light" data-action="'+(returning?'resume-course':'begin-course')+'">'+(returning?'Resume Course →':'Start Course →')+'</button>'+(returning?'<button type="button" class="button entry-secondary" data-action="reset-confirm">Start Fresh</button>':'')+'</div><small>'+(returning?done+' / 8 lessons mastered · evidence retained':'Foundation → Practitioner → Client-ready · self-paced')+'</small></div><div class="entry-journey" aria-label="Course journey"><span>01 <b>See the process</b><small>Understand how the business works</small></span><span>02 <b>Make the decision</b><small>Choose the simplest reliable approach</small></span><span>03 <b>Build the evidence</b><small>Apply, reflect and demonstrate</small></span></div></section>';
}
