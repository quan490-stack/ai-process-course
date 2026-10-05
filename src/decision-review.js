import {teachingFlow} from './visual-learning.js';
import {transitionScreen} from './motion.js';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phases=['Your recommendation','What would happen','Why','Preferred approach','Consultant takeaway'];

export function decisionReview(result,scope=''){
 const items=result.feedback||[];
 return '<section class="feedback decision-review" data-review-scope="'+e(scope)+'" aria-label="Review the outcome">'+
 '<header><p class="eyebrow">REVIEW THE OUTCOME</p><h2>Follow your recommendation into the business.</h2>'+(result.guided?'<p>Guided practice · no competency points. Written artifacts are preserved, not semantically evaluated.</p>':'<p class="review-score">Latest result: '+result.score+'/100'+(result.passed===false?' · further practice required':'')+'</p>')+'</header>'+
 items.map((f,i)=>'<article data-review-question="'+i+'" '+(i?'hidden':'')+'><p class="review-prompt">'+e(f.prompt)+'</p>'+[
  '<span class="badge '+(f.correct?'good':'warn')+'">'+e(f.quality||(f.correct?'Supported recommendation':'Needs revision'))+'</span><h3>Your recommendation</h3><p class="review-recommendation">'+e(f.selected)+'</p>',
  '<h3>What would happen</h3>'+teachingFlow('The likely business path',(f.chain||['Recommendation applied',f.consequence]).map((s,j)=>[j===0?'decision':f.correct?'output':'risk',s]),f.chain?f.consequence:'','review-chain'),
  '<h3>Why this recommendation '+(f.correct?'works':'needs revision')+'</h3><p>'+e(f.rationale)+'</p><details><summary>Inspect the evidence or principle</summary><p>'+e(f.evidence)+'</p></details>',
  '<h3>Preferred approach</h3><p>'+e(f.preferred)+'</p><details><summary>When an alternative could fit</summary><p>'+e(f.alternative)+'</p></details>',
  '<h3>Take this into your next client conversation.</h3><p class="review-takeaway">'+e(f.lens)+'</p>'
 ].map((body,j)=>'<section data-review-phase="'+j+'" '+(j?'hidden':'')+'>'+body+'</section>').join('')+'</article>').join('')+
 ((result.checks||[]).length?'<details class="review-rubric"><summary>Inspect the scoring breakdown</summary>'+(result.checks||[]).map(([name,w,ok,why])=>'<p><b>'+e(name)+' · '+(ok?w:0)+'/'+w+'</b><br>'+e(why)+'</p>').join('')+'</details>':'')+
 '<nav class="review-controls" aria-label="Outcome review"><button type="button" class="button secondary" data-review-back>← Back</button><span role="status" data-review-position></span><button type="button" class="button" data-review-next>Continue →</button></nav></section>';
}

export function enhanceReviews(root,state,save){
 const seen=new Map();
 for(const panel of root.querySelectorAll('.decision-review')){
  const items=[...panel.querySelectorAll('[data-review-question]')];if(!items.length)continue;
  state.experience.flow||={};const positions=state.experience.flow.reviews||={},scope=panel.dataset.reviewScope;
  const occurrence=seen.get(scope)||0;seen.set(scope,occurrence+1);const key=occurrence?scope+'@'+occurrence:scope;
  const position=scope?(positions[key]||={question:0,phase:0}):{question:0,phase:0};let busy=false;
  const show=(focus=false)=>{position.question=Math.min(position.question,items.length-1);items.forEach((item,i)=>{item.hidden=i!==position.question;item.querySelectorAll('[data-review-phase]').forEach((p,j)=>p.hidden=j!==position.phase);});panel.querySelector('[data-review-back]').disabled=position.question===0&&position.phase===0;panel.querySelector('[data-review-position]').textContent=(items.length>1?'Outcome '+(position.question+1)+' / '+items.length+' · ':'')+phases[position.phase];if(focus){const active=items[position.question].querySelector('[data-review-phase="'+position.phase+'"] h3');active.tabIndex=-1;active.focus({preventScroll:true});}};
  panel.addEventListener('click',async ev=>{const next=ev.target.closest('[data-review-next]'),back=ev.target.closest('[data-review-back]');if(!next&&!back||busy)return;
   if(next&&position.phase===4&&position.question===items.length-1){panel.dispatchEvent(new CustomEvent('reviewcomplete',{bubbles:true}));return;}
   busy=true;panel.querySelectorAll('.review-controls button').forEach(b=>b.disabled=true);await transitionScreen(items[position.question],()=>{if(back){if(position.phase)position.phase--;else{position.question--;position.phase=4;}}else if(position.phase<4)position.phase++;else{position.question++;position.phase=0;}show(true);},()=>items[position.question]);if(scope)save();busy=false;panel.querySelector('[data-review-next]').disabled=false;show();
  });show();
 }
}
