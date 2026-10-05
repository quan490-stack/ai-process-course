export const motionTokens=Object.freeze({page:180,section:220,feedback:180,message:180,progress:260,stagger:35,maxStagger:140});
export const easeOut=t=>1-(1-Math.max(0,Math.min(1,t)))**3;
export const interpolate=(from,to,t)=>from+(to-from)*easeOut(t);
export const shouldReduceMotion=(system,local)=>Boolean(system||local);
const active=new Set(),numeric=new Map(),frames=new Map(),positions=new Map();
let staticPreference=false,previousRoute='',previousMessage='';
const media=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
export const reduced=()=>shouldReduceMotion(media?.matches,staticPreference);
// Exit completes before rendering. A newer navigation cancels the previous swap.
export function createScreenTransition(){
 let sequence=0,running;
 return async (from,swap,destination)=>{
  const token=++sequence;running?.cancel();
  if(!reduced()&&from?.animate){const exit=from.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-8px)'}],{duration:130,easing:'ease-in',fill:'forwards'});running=exit;active.add(exit);try{await exit.finished;}catch{}active.delete(exit);if(token!==sequence)return false;exit.cancel();}
  if(token!==sequence)return false;swap();const to=destination?.();
  if(!reduced()&&to?.animate){const enter=to.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,easing:'cubic-bezier(.2,.7,.2,1)'});running=enter;active.add(enter);try{await enter.finished;}catch{}active.delete(enter);}
  return token===sequence;
 };
}
export const transitionScreen=createScreenTransition();
export function configureMotion(preference=false){staticPreference=Boolean(preference);if(globalThis.document)document.documentElement.classList.toggle('reduce-motion',reduced());if(reduced()){for(const a of active)a.cancel();active.clear();for(const id of frames.values())cancelAnimationFrame(id);frames.clear();for(const el of (globalThis.document?.querySelectorAll('[data-number]')||[]))el.textContent=el.dataset.display||el.dataset.number;}}
media?.addEventListener('change',()=>configureMotion(staticPreference));
function entrance(el,kind='section',index=0){if(!el||reduced()||!el.animate)return;const a=el.animate([{opacity:.55,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:motionTokens[kind],delay:Math.min(index*motionTokens.stagger,motionTokens.maxStagger),easing:'cubic-bezier(.2,.7,.2,1)'});active.add(a);a.finished.catch(()=>{}).finally(()=>active.delete(a));}
export function animateNumbers(root){for(const el of root.querySelectorAll('[data-number]')){const key=el.dataset.metric,to=Number(el.dataset.number),from=numeric.get(key);numeric.set(key,to);if(frames.has(key)){cancelAnimationFrame(frames.get(key));frames.delete(key);}if(!Number.isFinite(to)||from===undefined||from===to||reduced()){el.textContent=el.dataset.display||String(to);continue;}const format=n=>el.dataset.format==='money'?n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}):n.toFixed(Number(el.dataset.decimals||0));const start=performance.now();const tick=now=>{if(!el.isConnected){frames.delete(key);return;}const t=Math.min((now-start)/motionTokens.progress,1);el.textContent=t===1?(el.dataset.display||format(to)):format(interpolate(from,to,t));if(t<1)frames.set(key,requestAnimationFrame(tick));else frames.delete(key);};frames.set(key,requestAnimationFrame(tick));}}
export function enhanceMotion(root,route,{localStatic=false,submitted=false}={}){
 configureMotion(localStatic);
 const main=root.querySelector('main');
 if(previousRoute!==route){entrance(main,'page');[...main.querySelectorAll('.lesson-layout article>.card,.module,.starter-concept,.client-tile')].slice(0,8).forEach((el,i)=>entrance(el,'section',i));previousRoute=route;}
 if(submitted){for(const el of root.querySelectorAll('.feedback,.milestone'))entrance(el,'feedback');}
 const latest=root.querySelector('.reply.latest-message');if(latest&&previousMessage!==route+latest.textContent){entrance(latest,'message');previousMessage=route+latest.textContent;}
 for(const bar of root.querySelectorAll('[data-bar]')){const key=bar.dataset.barKey;if(key&&positions.has(key)&&!reduced()){bar.style.width=positions.get(key)+'%';requestAnimationFrame(()=>{if(bar.isConnected)bar.style.width=bar.dataset.bar+'%';});}else bar.style.width=bar.dataset.bar+'%';if(key)positions.set(key,bar.dataset.bar);}
 for(const point of root.querySelectorAll('[data-matrix-x]')){const old=positions.get('matrix');if(old&&!reduced()){point.style.left=old[0]+'%';point.style.bottom=old[1]+'%';requestAnimationFrame(()=>{if(point.isConnected){point.style.left=point.dataset.matrixX+'%';point.style.bottom=point.dataset.matrixY+'%';}});}else{point.style.left=point.dataset.matrixX+'%';point.style.bottom=point.dataset.matrixY+'%';}positions.set('matrix',[point.dataset.matrixX,point.dataset.matrixY]);}
 updateProgress(root,route);
 animateNumbers(root);
}
export function revealDetail(details){if(details.open)entrance(details.querySelector(':scope > div'),'section');}
export function animateInteraction(el){entrance(el,'feedback');}
export function scrollOptions(){return {block:'start',behavior:reduced()?'auto':'smooth'};}

export function updateProgress(root,route){ let progressIndex=0;for(const progress of root.querySelectorAll('progress')){const value=Number(progress.value)/(Number(progress.max)||100)*100,key='progress:'+route+':'+progressIndex++,old=positions.get(key);progress.classList.add('sr-only');let track=progress.nextElementSibling;if(!track?.classList.contains('progress-track')){track=document.createElement('div');track.className='progress-track';track.setAttribute('aria-hidden','true');track.append(document.createElement('span'));progress.after(track);}const fill=track.firstElementChild;fill.style.width=(old!==undefined&&!reduced()?old:value)+'%';if(old!==undefined&&old!==value&&!reduced())requestAnimationFrame(()=>{if(fill.isConnected)fill.style.width=value+'%';});positions.set(key,value);}}

export function clearMotionHistory(){
 for(const a of active)a.cancel();active.clear();for(const id of frames.values())cancelAnimationFrame(id);frames.clear();numeric.clear();positions.clear();previousRoute='';previousMessage='';
}
