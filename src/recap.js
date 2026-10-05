import {icon,typeLabel} from './visual-learning.js';
import {reduced} from './motion.js';
import {recapDuration} from './recaps.js';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mounted=new WeakMap();
export const recapFrames=config=>[...config.steps.map((s,i)=>({...s,kind:'step',index:i})),...(config.consequence?[{kind:'consequence',type:'risk',label:'The business boundary',detail:config.consequence}]:[]),{kind:'takeaway',type:'decision',label:'The consultant takeaway',detail:config.takeaway},{kind:'skill',type:'output',label:'Skill reinforced',detail:config.skillGained}];

// A bounded clock with injected scheduling for deterministic interaction tests.
export function createRecapPlayer({frames,initial={frame:0,status:'ready'},onChange=()=>{},schedule=setTimeout,cancel=clearTimeout,now=()=>performance.now()}){
 let frame=Math.max(0,Math.min(initial.frame||0,frames-1)),status=initial.status==='finished'?'finished':initial.status==='paused'?'paused':'ready',timer=null,remaining=4000,started=0,disposed=false;
 const emit=()=>onChange({frame,status,remaining});
 const stop=()=>{if(timer!==null)cancel(timer);timer=null;};
 const queue=()=>{started=now();timer=schedule(()=>{timer=null;if(disposed||status!=='playing')return;if(frame===frames-1){status='finished';emit();return;}frame++;remaining=4000;emit();queue();},remaining);};
 return {
  snapshot:()=>({frame,status,remaining}),
  play(){if(disposed||status==='playing')return;if(status==='finished'){frame=0;remaining=4000;}status='playing';emit();queue();},
  pause(){if(disposed||status!=='playing')return;remaining=Math.max(1,remaining-(now()-started));stop();status='paused';emit();},
  replay(){if(disposed)return;stop();frame=0;remaining=4000;status='playing';emit();queue();},
  skip(){if(disposed)return;stop();frame=frames-1;remaining=4000;status='finished';emit();},
  dispose(){if(disposed)return;stop();disposed=true;},
 };
}

export function recapMarkup(config,{nextRoute,evidence=[]}={}){
 return '<section class="lesson-recap" aria-label="Lesson recap"><header><p class="eyebrow">LESSON RECAP · '+Math.round(recapDuration(config)/1000)+' SECONDS</p><h3>'+escape(config.title)+'</h3>'+(config.businessExample?'<p class="recap-example">'+escape(config.businessExample)+'</p>':'')+'</header><ol class="recap-process" aria-label="Recap process">'+config.steps.map((s,i)=>'<li class="recap-node type-'+escape(s.type)+'" data-recap-node="'+i+'"><span class="recap-node-number">'+(i+1)+'</span>'+icon(s.type)+'<small>'+escape(typeLabel(s.type))+'</small><b>'+escape(s.label)+'</b><span class="recap-node-state" aria-hidden="true"></span>'+(i<config.steps.length-1?'<span class="recap-path" aria-hidden="true">→</span>':'')+'</li>').join('')+'</ol><div class="recap-story"><span data-recap-story-icon aria-hidden="true"></span><div><p class="eyebrow" data-recap-story-label></p><p data-recap-story-detail></p></div></div><div class="recap-resolution"><p class="recap-takeaway">'+escape(config.takeaway)+'</p><p class="recap-skill"><span>SKILL REINFORCED</span><b>'+escape(config.skillGained)+'</b></p>'+(evidence.length?'<small>Assessed evidence: '+escape(evidence.join(' · '))+'. Your first attempt remains retained.</small>':'')+'</div><div class="recap-timing" aria-hidden="true"><span data-recap-progress></span></div><p class="recap-status" role="status" aria-live="polite"></p><nav class="recap-controls" aria-label="Recap playback"><button type="button" class="button secondary" data-recap-play>Play recap</button><button type="button" class="text-button" data-recap-replay hidden>Replay</button><button type="button" class="text-button" data-recap-skip>Skip recap</button>'+(nextRoute?'<a class="button" data-recap-continue href="#'+escape(nextRoute)+'">Continue →</a>':'')+'</nav><details class="recap-transcript"><summary>Read the complete recap</summary><ol>'+config.steps.map(s=>'<li><b>'+escape(s.label)+'.</b> '+escape(s.detail)+'</li>').join('')+'</ol>'+(config.consequence?'<p><b>Business boundary:</b> '+escape(config.consequence)+'</p>':'')+'<p><b>Consultant takeaway:</b> '+escape(config.takeaway)+'</p><p><b>Skill reinforced:</b> '+escape(config.skillGained)+'</p></details></section>';
}

export function mountRecap(element,config,{id,state,save=()=>{},staticMode=()=>false,scheduler={}}={}){
 const frames=recapFrames(config),saved=state?.experience.flow?.recaps?.[id];let player;
 const persist=snapshot=>{if(!state||!id)return;state.experience.flow||={};state.experience.flow.recaps||={};state.experience.flow.recaps[id]={frame:snapshot.frame,status:snapshot.status==='playing'?'paused':snapshot.status};save();};
 const render=snapshot=>{
  const {frame,status}=snapshot,staticView=staticMode(),resolved=staticView||status==='finished',active=frames[frame];
  element.dataset.recapStatus=staticView?'static':status;element.dataset.recapMotion=reduced()?'reduced':'full';
  element.querySelectorAll('[data-recap-node]').forEach((node,i)=>{node.classList.toggle('recap-current',i===Math.min(frame,config.steps.length-1));node.classList.toggle('recap-active',!resolved&&active.kind==='step'&&i===active.index);node.classList.toggle('recap-visited',resolved||status!=='ready'&&i<frame);node.querySelector('.recap-node-state').textContent=resolved||status!=='ready'&&i<frame?'Reviewed':active.kind==='step'&&i===active.index?'Current':'Next';});
  const story=element.querySelector('.recap-story');story.hidden=resolved||active.kind==='takeaway'||active.kind==='skill';
  element.querySelector('[data-recap-story-icon]').innerHTML=icon(active.type);element.querySelector('[data-recap-story-label]').textContent=active.label;element.querySelector('[data-recap-story-detail]').textContent=active.detail;
  element.querySelector('.recap-resolution').hidden=!resolved&&active.kind!=='takeaway'&&active.kind!=='skill';
  element.querySelector('.recap-skill').hidden=!resolved&&active.kind!=='skill';
  const evidence=element.querySelector('.recap-resolution small');if(evidence)evidence.hidden=!resolved&&active.kind!=='skill';
  element.querySelector('[data-recap-progress]').style.width=(resolved?100:(frame/frames.length*100))+'%';
  const play=element.querySelector('[data-recap-play]');play.disabled=staticView;play.textContent=staticView?'Static recap':status==='playing'?'Pause':status==='paused'?'Resume recap':status==='finished'?'Replay':'Play recap';
  element.querySelector('[data-recap-replay]').hidden=staticView||status==='ready'||status==='finished';element.querySelector('[data-recap-skip]').hidden=resolved;
  element.querySelector('.recap-status').textContent=staticView?'Static mode · complete diagram and takeaway.':status==='ready'?'A short business explainer. Play when you are ready, or continue.':status==='finished'?'Recap complete. Replay any time.':(status==='paused'?'Paused · ':'')+(frame+1)+' of '+frames.length+' · '+active.label;
  if(status==='playing'&&!reduced())story.animate?.([{opacity:.4,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:250,easing:'ease-out'});
  else if(status==='playing'&&!staticView)story.animate?.([{opacity:.65},{opacity:1}],{duration:120});
 };
 player=createRecapPlayer({frames:frames.length,initial:saved,...scheduler,onChange:snapshot=>{render(snapshot);persist(snapshot);}});
 const click=event=>{if(event.target.closest('[data-recap-continue]')){player.pause();return;}if(event.target.closest('[data-recap-skip]')){player.skip();element.querySelector('[data-recap-play]').focus();}if(event.target.closest('[data-recap-play]')&&!staticMode()){if(player.snapshot().status==='playing')player.pause();else player.play();}if(event.target.closest('[data-recap-replay]')&&!staticMode())player.replay();};
 const visibility=()=>{if(document.hidden)player.pause();},leave=()=>player.pause();
 element.addEventListener('click',click);document.addEventListener('visibilitychange',visibility);globalThis.window?.addEventListener('pagehide',leave);
 render(player.snapshot());
 const dispose=()=>{player.dispose();element.removeEventListener('click',click);document.removeEventListener('visibilitychange',visibility);globalThis.window?.removeEventListener('pagehide',leave);mounted.delete(element);};
 mounted.set(element,{dispose,player});return {dispose,player};
}
export function disposeRecaps(root){for(const element of root.querySelectorAll('.lesson-recap'))mounted.get(element)?.dispose();}

export function pauseRecaps(root){for(const element of root.querySelectorAll('.lesson-recap'))mounted.get(element)?.player.pause();}
