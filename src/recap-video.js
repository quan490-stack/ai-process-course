const publicAsset=path=>typeof path==='string'&&path.startsWith('/assets/')?'.'+path:path;
import {readyVideo} from './video-recaps.js';
import {reduced} from './motion.js';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mounted=new WeakMap();
export function recapVideoMarkup(config,{nextRoute}={}){
 const ready=readyVideo(config);
 return '<section class="recap-video" aria-label="Presenter video recap"><header><p class="eyebrow">PRESENTER RECAP'+(ready?' · '+Math.round(config.duration)+' SECONDS':' · PILOT · VIDEO PENDING')+'</p><h3>Carry this idea into your next client.</h3></header>'+
 (ready?'<video controls playsinline preload="none" poster="'+e(publicAsset(config.posterSource))+'" aria-label="'+e(config.title)+' recap video" aria-describedby="video-recap-status-'+e(config.lessonId)+'" data-media-source="'+e(publicAsset(config.videoSource))+'"><track kind="captions" srclang="en" label="English" src="'+e(publicAsset(config.captionSource))+'" default></video>':'<div class="recap-video-pending"><span class="recap-video-mark" aria-hidden="true">▶</span><p><b>Presenter video is awaiting production.</b><br>Your lesson is complete. Read the recap or continue learning.</p></div>')+
 '<p class="video-recap-status" id="video-recap-status-'+e(config.lessonId)+'" role="status">'+(ready?'Play when you’re ready. Captions are available.':'The speaking-avatar video is not available yet.')+'</p><nav class="video-recap-controls" aria-label="Video recap controls">'+(ready?'<button type="button" class="button secondary" data-video-play>Play recap</button><button type="button" class="button secondary" data-video-replay hidden>Replay</button>':'')+'<button type="button" class="video-skip" data-video-skip>Skip recap</button>'+(nextRoute?'<a class="button" data-video-continue href="#'+e(nextRoute)+'">Continue →</a>':'')+'</nav><details class="video-transcript"><summary>Read the recap'+(ready?' transcript':' script')+'</summary><p>'+e(config.transcript)+'</p><div class="video-takeaway"><b>'+e(config.takeaway)+'</b><p>Skill '+(ready?'reinforced':'focus')+': '+e(config.skillGained)+'</p><small>Assessed competencies: '+e(config.competencies.join(' · '))+'. Recap viewing adds no assessment credit.</small></div></details></section>';
}
export function mountRecapVideo(element,config,{state,save=()=>{},staticMode=()=>false}={}){
 const video=element.querySelector('video'),status=element.querySelector('.video-recap-status'),play=element.querySelector('[data-video-play]'),replay=element.querySelector('[data-video-replay]'),transcript=element.querySelector('.video-transcript');
 let lastSaved=-1,disposed=false,failed=false,started=false,seekTime=null,finishedPlayback=false;
 const saved=state?.experience.flow?.videoRecaps?.[config.lessonId];
 finishedPlayback=Boolean(saved&&saved.status!=='paused');
 const persist=kind=>{if(!state||!video||!started)return;state.experience.flow||={};state.experience.flow.videoRecaps||={};state.experience.flow.videoRecaps[config.lessonId]={time:Math.min(45,Math.max(0,Number(video.currentTime)||0)),status:kind};save();};
 const pause=()=>{if(video&&!video.paused){video.pause();persist('paused');}};
 const unavailable=()=>{failed=true;pause();if(play)play.disabled=true;if(replay)replay.disabled=true;status.textContent='Video unavailable. Read the full transcript or continue; your lesson completion is retained.';transcript.open=true;};
 const load=()=>{if(!video.getAttribute('src')){video.setAttribute('src',video.dataset.mediaSource);video.load();}};
 const start=async reset=>{if(disposed||!video||failed)return;seekTime=reset?0:!started&&saved?.status==='paused'?saved.time:null;started=true;load();if(video.readyState>=1&&seekTime!==null){video.currentTime=seekTime;seekTime=null;}try{await video.play();}catch{if(!disposed){status.textContent='Playback did not start. Use the video controls to try again, or read the transcript.';transcript.open=true;}}};
 const metadata=()=>{if(seekTime!==null){video.currentTime=Math.min(seekTime,video.duration||45);seekTime=null;}};
 const onPlay=()=>{started=true;finishedPlayback=false;play.textContent='Pause';replay.hidden=false;status.textContent='Playing recap. You can pause, skip or continue at any time.';persist('paused');};
 const onPause=()=>{if(disposed||video.ended)return;play.textContent=video.currentTime?'Resume recap':'Play recap';status.textContent='Recap paused.';persist('paused');};
 const onEnd=()=>{finishedPlayback=true;play.textContent='Replay recap';replay.hidden=true;status.textContent='Recap finished. Replay any time, or continue.';persist('finished');};
 const time=()=>{if(Math.abs(video.currentTime-lastSaved)>=2){lastSaved=video.currentTime;persist('paused');}};
 const click=ev=>{if(ev.target.closest('[data-video-continue]'))pause();if(ev.target.closest('[data-video-skip]')){pause();if(video){started=true;finishedPlayback=true;persist('skipped');}status.textContent='Recap skipped. Your lesson was already complete.';element.querySelector('[data-video-continue]')?.focus();}if(ev.target.closest('[data-video-play]')){if(video.paused)start(video.ended||finishedPlayback);else pause();}if(ev.target.closest('[data-video-replay]'))start(true);};
 const visibility=()=>{if(document.hidden)pause();};
 element.addEventListener('click',click);document.addEventListener('visibilitychange',visibility);globalThis.window?.addEventListener('pagehide',pause);
 const events={loadedmetadata:metadata,play:onPlay,pause:onPause,ended:onEnd,timeupdate:time,error:unavailable};
 if(video){for(const [name,fn]of Object.entries(events))video.addEventListener(name,fn);if(saved){play.textContent=saved.status==='paused'?'Resume recap':'Replay recap';status.textContent='Your recap remains replayable. Playback never starts automatically.';}if(staticMode()||reduced()){transcript.open=true;status.textContent='Motion preference respected: read the static transcript, or choose to play the video.';}}
 const dispose=()=>{if(disposed)return;pause();disposed=true;element.removeEventListener('click',click);document.removeEventListener('visibilitychange',visibility);globalThis.window?.removeEventListener('pagehide',pause);if(video){for(const [name,fn]of Object.entries(events))video.removeEventListener(name,fn);video.removeAttribute('src');video.load();}mounted.delete(element);};
 mounted.set(element,{pause,dispose});return {pause,dispose};
}
export function pauseRecapVideos(root){for(const el of root.querySelectorAll('.recap-video'))mounted.get(el)?.pause();}
export function disposeRecapVideos(root){for(const el of root.querySelectorAll('.recap-video'))mounted.get(el)?.dispose();}
