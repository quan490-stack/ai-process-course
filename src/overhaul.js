import {videoRecaps} from './video-recaps.js';
import {recapVideoMarkup,mountRecapVideo,pauseRecapVideos} from './recap-video.js';
import {lessonRecaps} from './recaps.js';
import {recapMarkup,mountRecap,pauseRecaps} from './recap.js';
import {icon, teachingFlow, notation} from './visual-learning.js';
import {lessons,cases} from './content.js';
import {assessmentSummary,lessonMastered,readiness,competency,gradeFailure} from './engine.js';
import {reduced, transitionScreen} from './motion.js';
import {starterUnits} from './beginner.js';
import {flowState,guidedStages,nextProgramRoute,activityComplete,routeTitle,programRoutes} from './learning-flow.js';
import {enhanceReviews} from './decision-review.js';

const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const make=(tag,cls,html='')=>{const el=document.createElement(tag);el.className=cls;el.innerHTML=html;return el;};
export const flagshipStages=['Welcome','Four types of work','Inside the business','Change the process','Make the decision','See the consequence','Consultant lens','Apply it'];
export const standardStages=['Welcome','See the process','Consultant lens','Make the decision','See the consequence','Apply it'];
export const stageNames=id=>id==='fit'?flagshipStages:standardStages;
export function validPresentation(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 return Object.entries(value).every(([id,p])=>lessons.some(l=>l.id===id)&&p&&typeof p==='object'&&!Array.isArray(p)&&Object.entries(p).every(([k,v])=>k==='stage'?Number.isInteger(v)&&v>=0&&v<stageNames(id).length:k==='method'?['rules','system','ai','human'].includes(v):k==='boundary'?Number.isInteger(v)&&v>=0&&v<5:false));
}

function methods(section,p,save){
 if(!section)return;
 const tiles=[...section.querySelectorAll('.method-tile')],grid=section.querySelector('.method-grid');
 const tabs=make('div','method-switcher');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Types of work');
 const types=['rules','system','ai','human'],labels=['Rules','Software','AI','Human'];
 tiles.forEach((tile,i)=>{const type=types[i],id='work-'+type;tile.id=id;tile.setAttribute('role','tabpanel');tile.setAttribute('aria-labelledby','tab-'+type);const b=make('button','method-tab type-'+type,icon(type)+'<b>'+labels[i]+'</b><small>'+['Certainty','Records','Interpretation','Judgment'][i]+'</small>');b.type='button';b.id='tab-'+type;b.setAttribute('role','tab');b.setAttribute('aria-controls',id);b.dataset.method=type;tabs.append(b);});
 grid.before(tabs);grid.classList.add('method-focus');
 const show=(type,focus=false)=>{p.method=type;tiles.forEach((tile,i)=>{tile.hidden=types[i]!==type;const b=tabs.children[i];b.setAttribute('aria-selected',String(types[i]===type));b.tabIndex=types[i]===type?0:-1;});if(focus)tabs.querySelector('[aria-selected="true"]').focus();};
 show(p.method||'rules');
 tabs.addEventListener('click',ev=>{const b=ev.target.closest('[data-method]');if(b){show(b.dataset.method);save();animatePanel(grid);}});
 tabs.addEventListener('keydown',ev=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(ev.key))return;ev.preventDefault();const i=types.indexOf(p.method),next=ev.key==='Home'?0:ev.key==='End'?3:(i+(ev.key==='ArrowRight'?1:3))%4;show(types[next],true);save();animatePanel(grid);});
}
function animatePanel(el){if(!reduced())el?.animate?.([{opacity:.3,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});}

function solar(section,p,save){
 if(!section)return;
 const steps=[...section.querySelectorAll('.story-step')];
 const nav=make('div','boundary-nav');nav.setAttribute('aria-label','Procurement boundaries');
 steps.forEach((step,i)=>{const b=make('button',step.className,step.querySelector('.story-top').innerHTML);b.type='button';b.dataset.boundary=i;b.setAttribute('aria-controls','boundary-'+i);step.id='boundary-'+i;nav.append(b);});
 section.querySelector('.procurement-story').before(nav);
 const warning=section.querySelector('.mistake-comparison');if(warning)warning.hidden=true;
 const show=i=>{p.boundary=i;steps.forEach((s,j)=>{s.hidden=j!==i;nav.children[j].setAttribute('aria-pressed',String(j===i));});};show(p.boundary||0);
 nav.addEventListener('click',ev=>{const b=ev.target.closest('[data-boundary]');if(b){show(Number(b.dataset.boundary));save();animatePanel(section.querySelector('.procurement-story'));}});
}

function decisionDeck(form,state,save=()=>{}){
 const fields=[...form.querySelectorAll(':scope > fieldset')];if(!fields.length)return;
 form.noValidate=true;
 fields.forEach((f,i)=>{f.dataset.decisionIndex=i;f.querySelectorAll('.choice').forEach((choice,j)=>{choice.classList.add('recommendation');const text=choice.querySelector(':scope > span');text.insertAdjacentHTML('afterbegin','<small class="recommendation-label">RECOMMENDATION '+String.fromCharCode(65+j)+'</small>');});});
 const controls=make('div','decision-controls','<button type="button" class="button secondary" data-deck-prev>← Previous</button><span role="status"></span><button type="button" class="button" data-deck-next>Next decision →</button>');
 const submit=form.querySelector('[type="submit"],button:not([type])');if(!submit)return;submit.before(controls);
 const scope=form.dataset.submit==='starter'?'starter:'+form.dataset.id:form.dataset.submit+':'+(form.dataset.id||'');
 let index=state?.experience.flow?.decisions?.[scope]||0;
 if(fields.length===1)controls.hidden=true;
 const show=(next,focus=false)=>{index=Math.max(0,Math.min(fields.length-1,next));fields.forEach((f,i)=>f.hidden=i!==index);const chosen=Boolean(fields[index].querySelector('input:checked'));controls.querySelector('span').textContent='Decision '+(index+1)+' of '+fields.length;controls.querySelector('[data-deck-prev]').disabled=index===0;controls.querySelector('[data-deck-next]').hidden=index===fields.length-1;controls.querySelector('[data-deck-next]').disabled=!chosen;submit.hidden=index!==fields.length-1;submit.disabled=Boolean(form.querySelector('.revise-control'))||fields.some(f=>!f.querySelector('input:checked'));if(focus){fields[index].querySelector('legend').tabIndex=-1;fields[index].querySelector('legend').focus({preventScroll:true});} };
 form.addEventListener('input',()=>show(index));
 controls.addEventListener('click',ev=>{if(ev.target.closest('[data-deck-next]'))show(index+1,true);if(ev.target.closest('[data-deck-prev]'))show(index-1,true);if(state){const flow=flowState(state);(flow.decisions||={})[scope]=index;save();}animatePanel(fields[index]);});
 form.addEventListener('click',ev=>{if(ev.target.closest('[data-action="revise"]'))queueMicrotask(()=>show(0,true));});
 form.addEventListener('submit',ev=>{const missing=fields.findIndex(f=>!f.querySelector('input:checked'));if(missing>=0){ev.preventDefault();ev.stopImmediatePropagation();show(missing,true);}},true);
 show(index);
}

function assignmentDeck(form,state,save){
 const fields=[...form.querySelectorAll(':scope > .field')];if(!fields.length)return;
 form.noValidate=true;const assessment=[...form.querySelectorAll(':scope > fieldset')],submit=form.querySelector('[type="submit"]');
 assessment.forEach(f=>f.querySelectorAll('.choice').forEach((choice,j)=>{choice.classList.add('recommendation');choice.querySelector(':scope > span')?.insertAdjacentHTML('afterbegin','<small class="recommendation-label">APPLICATION '+String.fromCharCode(65+j)+'</small>');}));
 const steps=[...fields,...assessment];const controls=make('div','decision-controls','<button type="button" class="button secondary" data-apply-prev>← Previous</button><span role="status"></span><button type="button" class="button" data-apply-next>Save & continue →</button>');submit.before(controls);const scope='assignment:'+form.dataset.id;let index=state.experience.flow?.decisions?.[scope]||0;
 const valid=i=>steps[i].matches('fieldset')?Boolean(steps[i].querySelector('input:checked')):steps[i].querySelector('textarea').checkValidity();
 const show=(i,focus=false)=>{index=Math.max(0,Math.min(steps.length-1,i));steps.forEach((s,j)=>s.hidden=j!==index);controls.querySelector('span').textContent='Application '+(index+1)+' of '+steps.length;controls.querySelector('[data-apply-prev]').disabled=index===0;controls.querySelector('[data-apply-next]').hidden=index===steps.length-1;submit.hidden=index!==steps.length-1;if(focus)(steps[index].querySelector('textarea,input:checked,input')||steps[index]).focus({preventScroll:true});};
 controls.addEventListener('click',ev=>{if(ev.target.closest('[data-apply-prev]'))show(index-1,true);if(ev.target.closest('[data-apply-next]')){if(valid(index))show(index+1,true);else (steps[index].querySelector('textarea')||steps[index].querySelector('input')).reportValidity();}(flowState(state).decisions||={})[scope]=index;save();animatePanel(steps[index]);});
 form.addEventListener('submit',ev=>{const missing=steps.findIndex((_,i)=>!valid(i));if(missing>=0){ev.preventDefault();ev.stopImmediatePropagation();show(missing,true);steps[missing].querySelector('textarea,input')?.reportValidity();}},true);show(index);
}

function lessonExperience(root,id,state,save){
 const l=lessons.find(l=>l.id===id);if(!l)return;
 state.experience.presentation||={};const p=state.experience.presentation[id]||={stage:0};
 const main=root.querySelector('main'),hero=main.querySelector('.lesson-hero'),layout=main.querySelector('.lesson-layout'),article=layout.querySelector('article'),rail=layout.querySelector('.lesson-context');
 const visual=article.querySelector('.visual-primer'),concept=article.querySelector('.concept-summary'),decision=article.querySelector('.decision-workspace'),apply=article.querySelector('.practice-workspace');
 const names=stageNames(id),sections=names.map((name,i)=>{const s=make('section','lesson-screen');s.dataset.lessonStage=i;s.setAttribute('aria-label',name);s.id='stage-'+i;return s;});
 sections[0].append(hero);
 const intro=hero.querySelector('.hero-copy>p:not(.eyebrow)');if(id==='fit')intro.textContent='Learn where AI belongs — and where it does not.';
 hero.querySelector('[data-local-anchor]')?.remove();hero.querySelector('.hero-copy').append(make('div','skill-targets',l.skill.map(s=>'<span>'+e(s)+'</span>').join('')));
 hero.querySelector('.hero-copy').append(make('button','button light','Start lesson →'));hero.querySelector('button').type='button';hero.querySelector('button').dataset.lessonGo=1;
 let conceptIndex,decisionIndex,feedbackIndex,applyIndex;
 if(id==='fit'){
  sections[1].append(visual.querySelector('.method-comparison'));sections[2].append(visual.querySelector('.solar-example'));sections[3].append(visual.querySelector('.visual-lab'));
  methods(sections[1],p,save);solar(sections[2].querySelector('.solar-example'),p,save);
  conceptIndex=6;decisionIndex=4;feedbackIndex=5;applyIndex=7;
  sections[6].append(make('div','lens-statement','<p class="eyebrow">A PRINCIPLE TO TAKE INTO YOUR NEXT CLIENT</p><h2>AI handles ambiguity.<br>Rules handle certainty.<br><span>Humans own accountability.</span></h2>'+teachingFlow('Keep the responsibility visible',[['ai','Interpret'],['rules','Calculate'],['human','Judge'],['approval','Authorize']])));
  const lab=sections[3].querySelector('.visual-lab'),select=lab.querySelector('[data-field$="calculation"]');
  const switcher=make('label','experiment-switch','<input type="checkbox" '+(select.value==='ai'?'checked':'')+'><span><b>Allow AI to calculate the quantity</b><small>Change one boundary. Watch the business consequence.</small></span>');select.closest('.field').hidden=true;lab.querySelector('.visual-controls').before(switcher);
  switcher.querySelector('input').addEventListener('change',ev=>{select.value=ev.target.checked?'ai':'rules';select.dispatchEvent(new Event('input',{bubbles:true}));});
 }else{sections[1].append(visual);conceptIndex=2;decisionIndex=3;feedbackIndex=4;applyIndex=5;}
 sections[conceptIndex].append(concept);concept.querySelector('details').open=false;
 if(id!=='fit'){const detail=concept.querySelector('details');detail.open=false;detail.querySelector('summary').textContent='Explore the principle, example and common mistake';concept.querySelector('h2')?.remove();concept.prepend(make('div','principle-focus','<p class="eyebrow">THE CONSULTANT LENS</p><h2>'+e(l.takeaway)+'</h2><p>'+e(l.why)+'</p>'));}
 const comparison=sections[1].querySelector('.state-comparison');if(comparison){const figures=[...comparison.querySelectorAll('figure')],lane=comparison.querySelector('.exception-lane'),switcher=make('div','studio-tabs','<button type="button" class="button secondary" data-state="0">Current state</button><button type="button" class="button secondary" data-state="1">Future state</button>');figures[0].before(switcher);const select=i=>{figures.forEach((f,j)=>f.hidden=j!==i);if(lane)lane.hidden=i!==1;switcher.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));};select(0);switcher.addEventListener('click',ev=>{const b=ev.target.closest('[data-state]');if(b){select(Number(b.dataset.state));animatePanel(comparison);}});}
 sections[decisionIndex].append(decision);sections[applyIndex].append(apply);
 const legacy=decision.querySelector(':scope > .notice');if(legacy&&legacy.textContent.includes('Previous edition')){const archive=make('details','assessment-archive','<summary>Previous edition work</summary>');decision.append(archive);archive.append(legacy);}
 const feedback=decision.querySelector('.feedback'),report=decision.querySelector('.notice:last-of-type');
 sections[feedbackIndex].append(make('div','stage-heading','<p class="eyebrow">DECISION → BUSINESS CONSEQUENCE</p><h2>What does your recommendation change?</h2><p>Examine the outcome, then the evidence and reasoning.</p>'));
 if(feedback)sections[feedbackIndex].append(feedback);else sections[feedbackIndex].append(make('div','awaiting-decision',icon('decision')+'<h3>Your decision comes first.</h3><p>Submit the consulting decisions to reveal their business consequences.</p><button type="button" class="button" data-lesson-go="'+decisionIndex+'">Make the decision →</button>'));
 if(feedback)sections[feedbackIndex].querySelector('.stage-heading').remove();
 if(report&&report.textContent.includes('First ')){const retained=make('details','assessment-archive','<summary>Inspect retained first-attempt evidence</summary>');retained.append(report);sections[feedbackIndex].append(retained);}
 const purposes=id==='fit'?['','WHY THIS MATTERS · A consultant must distinguish interpretation, calculation and authority.','YOUR TASK · Follow the supplier information to the person who can authorize an order.','YOUR TASK · Predict what changes when calculation authority moves to AI.','YOUR TASK · Recommend the simplest reliable change using the client evidence.','WHY THIS MATTERS · Trace the business effect of each recommendation.','WHY THIS MATTERS · Take the same responsibility boundaries into another client.','YOUR TASK · Apply the principle to a different process and defend your decisions.']:['','YOUR TASK · Inspect the owners, handoffs and controls in this process.','WHY THIS MATTERS · Connect the visual boundary to your consulting judgment.','YOUR TASK · Use the evidence to defend a recommendation.','WHY THIS MATTERS · Explain the business effect, not just the answer.','YOUR TASK · Demonstrate the principle in a practical process.'];
 sections.forEach((s,i)=>{if(purposes[i])s.prepend(make('p','stage-reason',e(purposes[i])));});
 article.replaceChildren(...sections);main.prepend(make('header','lesson-heading','<a href="#course">← Learning path</a><span>'+(lessons.indexOf(l)<4?'FOUNDATION':'PRACTITIONER')+' · LESSON '+(lessons.indexOf(l)+1)+'</span><b>'+e(l.title)+'</b>'));
 rail.querySelector('.lesson-itinerary').innerHTML='<p class="eyebrow">YOUR PROGRESS IN THIS LESSON</p><div class="stage-progress"><b data-stage-count></b><span>stages · guided learning</span></div><div class="stage-track"><span></span></div><ol>'+names.map((name,i)=>'<li><button type="button" data-lesson-go="'+i+'"><span class="itinerary-number">'+(i+1)+'</span><span><b>'+name+'</b></span></button></li>').join('')+'</ol><small>Stages do not award points. Assessed decisions and applied work establish mastery.</small>';
 const footer=make('nav','stage-footer','<button type="button" class="button secondary" data-stage-back>← Back</button><span role="status" data-stage-status></span><button type="button" class="button" data-stage-next>Continue →</button>');footer.setAttribute('aria-label','Lesson stage navigation');article.append(footer);
 const mobile=make('nav','mobile-stage-nav','<label><span>Lesson stage</span><select aria-label="Choose lesson stage">'+names.map((name,i)=>'<option value="'+i+'">'+(i+1)+' / '+names.length+' · '+e(name)+'</option>').join('')+'</select></label>');article.before(mobile);
 rail.append(make('button','button secondary lesson-restart','Restart Lesson'));rail.lastElementChild.type='button';rail.lastElementChild.dataset.action='restart-lesson';rail.lastElementChild.dataset.lesson=id;
 const itinerary=rail.querySelector('.lesson-itinerary ol'),exploration=make('details','optional-exploration','<summary>Optional exploration · lesson stages</summary>');itinerary.before(exploration);exploration.append(itinerary);
 const mobileExplore=make('details','optional-exploration mobile-exploration','<summary>Optional exploration · lesson stages</summary>');mobile.before(mobileExplore);mobileExplore.append(mobile);
 let busy=false;
 const show=(next,focus=false)=>{pauseRecaps(root);pauseRecapVideos(root);p.stage=Math.max(0,Math.min(names.length-1,next));mobile.querySelectorAll('option').forEach(o=>o.selected=Number(o.value)===p.stage);sections.forEach((s,i)=>s.hidden=i!==p.stage);hero.hidden=false;main.querySelector('.lesson-heading').hidden=p.stage===0;rail.querySelector('[data-stage-count]').textContent=(p.stage+1)+' / '+names.length;rail.querySelector('.stage-track>span').style.width=((p.stage+1)/names.length*100)+'%';rail.querySelectorAll('[data-lesson-go]').forEach(b=>{b.setAttribute('aria-current',Number(b.dataset.lessonGo)===p.stage?'step':'false');});footer.hidden=p.stage===0||p.stage===feedbackIndex;footer.querySelector('[data-stage-status]').textContent=names[p.stage];footer.querySelector('[data-stage-back]').disabled=p.stage===0;const nextButton=footer.querySelector('[data-stage-next]');nextButton.hidden=[decisionIndex,feedbackIndex,applyIndex].includes(p.stage);nextButton.textContent=p.stage===decisionIndex?'Review consequence →':'Continue →';if(focus){const target=sections[p.stage].querySelector('h1,h2')||sections[p.stage];target.tabIndex=-1;target.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});} };
 const go=async next=>{if(busy||next===p.stage)return;busy=true;footer.querySelectorAll('button').forEach(b=>b.disabled=true);await transitionScreen(sections[p.stage],()=>show(next,true),()=>sections[p.stage]);save();busy=false;footer.querySelectorAll('button').forEach(b=>b.disabled=false);footer.querySelector('[data-stage-back]').disabled=p.stage===0;};
 sections[feedbackIndex].addEventListener('reviewcomplete',()=>go(feedbackIndex+1));
 const applicationFeedback=apply.querySelector('.decision-review'),applicationReviewStage=make('section','application-review-stage');applicationReviewStage.hidden=!applicationFeedback;
 if(applicationFeedback){applicationFeedback.dataset.reviewScope='assignment:'+id;applicationReviewStage.append(applicationFeedback);apply.hidden=true;}sections[applyIndex].append(applicationReviewStage);
 const completion=make('div','completion-stage lesson-completion','<p class="eyebrow">LESSON COMPLETE</p><h2>'+e(l.title)+'</h2><p class="eyebrow">WHAT YOU LEARNED</p><p>'+e(l.takeaway)+'</p><p class="eyebrow">SKILL EVIDENCE GAINED</p><p>'+e(l.skill.join(' · '))+' — submitted decisions and applied work. First-attempt evidence remains retained.</p><p class="eyebrow">WHAT COMES NEXT</p><p>'+e(lessons[lessons.indexOf(l)+1]?.title||'Investigate your first client engagement.')+'</p><a class="button" href="#'+nextProgramRoute('lesson:'+id)+'">Continue →</a>');completion.hidden=true;sections[applyIndex].append(completion);
 if(lessonRecaps[id]){completion.innerHTML='<p class="eyebrow">LESSON COMPLETE</p><h2>'+e(l.title)+'</h2>'+recapVideoMarkup(videoRecaps[id],{nextRoute:nextProgramRoute('lesson:'+id)})+'<details class="optional-native-recap"><summary>Optional visual recap · process walkthrough</summary>'+recapMarkup(lessonRecaps[id],{evidence:l.skill})+'</details>';mountRecapVideo(completion.querySelector('.recap-video'),videoRecaps[id],{state,save,staticMode:()=>state.experience.staticMotion});mountRecap(completion.querySelector('.lesson-recap'),lessonRecaps[id],{id,state,save,staticMode:()=>state.experience.staticMotion});}
 if(videoRecaps[id]&&lessonMastered(state,id)){const revisit=make('button','button secondary lesson-recap-revisit','View lesson recap');revisit.type='button';rail.append(revisit);revisit.addEventListener('click',async()=>{await go(applyIndex);apply.hidden=true;applicationReviewStage.hidden=true;completion.hidden=false;sections[applyIndex].querySelector('.stage-reason')?.remove();(flowState(state).activities||={})['lesson:'+id]='complete';completion.querySelector('h2').tabIndex=-1;completion.querySelector('h2').focus();save();});}
 const finishApplication=()=>{if(!lessonMastered(state,id)){applicationReviewStage.hidden=true;apply.hidden=false;const lessonPassed=assessmentSummary(state,'lesson:'+id).latest?.passed;const retryArea=make('div','completion-stage','<h2>One more boundary needs your attention.</h2><p>'+(!lessonPassed?'Revisit the scored recommendations before completing this chapter.':'Revise the practical application using the feedback you just reviewed.')+'</p><button type="button" class="button">'+(!lessonPassed?'Revise my decisions →':'Revise my application →')+'</button>');apply.append(retryArea);retryArea.querySelector('button').addEventListener('click',()=>{const workspace=lessonPassed?apply:decision;const archive=workspace.querySelector('.assessment-archive');if(archive)archive.open=true;workspace.querySelector('[data-action="revise"]')?.click();retryArea.remove();if(!lessonPassed)go(decisionIndex);});return;}flowState(state).activities||={};state.experience.flow.activities['lesson:'+id]='complete';apply.hidden=true;applicationReviewStage.hidden=true;sections[applyIndex].querySelector('.stage-reason')?.remove();completion.hidden=false;completion.querySelector('h2').tabIndex=-1;completion.querySelector('h2').focus();save();};
 sections[applyIndex].addEventListener('reviewcomplete',finishApplication);
 mobile.addEventListener('change',ev=>go(Number(ev.target.value)));
 layout.addEventListener('click',ev=>{const b=ev.target.closest('[data-lesson-go],[data-stage-next],[data-stage-back]');if(!b)return;ev.preventDefault();go(b.hasAttribute('data-lesson-go')?Number(b.dataset.lessonGo):p.stage+(b.hasAttribute('data-stage-next')?1:-1));});
 // Submission renders again in the consequence stage without modifying evidence.
 decision.querySelector('form').addEventListener('submit',ev=>{if(!ev.defaultPrevented)p.stage=feedbackIndex;});
 decisionDeck(decision.querySelector('form'),state,save);assignmentDeck(apply.querySelector('form'),state,save);
 if(state.assessments['assignment:'+id]?.history?.length){const form=apply.querySelector('form'),detail=make('details','assessment-archive','<summary>Review or revise your practical work</summary>');form.before(detail);detail.append(form);}
 const notes=apply.querySelector(':scope > .field');if(notes){const detail=make('details','assessment-archive','<summary>Your additional working notes</summary>');notes.before(detail);detail.append(notes);}
 for(const figure of sections[1].querySelectorAll('figure'))inspectFlow(figure);
 show(p.stage||0);
 if(state.experience.flow?.activities?.['lesson:'+id]==='complete'&&lessonMastered(state,id)){apply.hidden=true;applicationReviewStage.hidden=true;completion.hidden=false;sections[applyIndex].querySelector('.stage-reason')?.remove();}
}

export function enhanceProduct(root,route,state,save){
 const [page,id]=route.split(':');root.classList.add('premium-product');
 const brief=root.querySelector('.activity-brief');if(brief){const sequence=make('details','activity-sequence','<summary>Your consulting sequence</summary>');brief.before(sequence);sequence.append(brief);}
 for(const ring of root.querySelectorAll('[data-readiness]'))ring.style.setProperty('--readiness',ring.dataset.readiness);
 if(page==='lesson')lessonExperience(root,id,state,save);
 if(page==='start'&&id!=='practice')starterExperience(root,id,state,save);
 if(page==='start'&&id==='practice')guidedWorkshop(root,state,save);
 for(const form of root.querySelectorAll('form[data-submit="starter"],form[data-submit="conversation"]'))decisionDeck(form,state,save);
 for(const form of root.querySelectorAll('form[data-submit="case"],form[data-submit="map"],form[data-submit="opportunity"],form[data-submit="failure"],form[data-submit="consequence"]'))selectDecisions(form,state,save);
 if(page==='case')interviewExperience(root,id,state,save);
 if(page==='map')workflowExperience(root,state,save);
 if(page==='failure')failureExperience(root,state);
 if(page==='roi'){workbenchExperience(root);root.querySelector('main').append(make('div','completion-stage','<p class="eyebrow">NEXT IN YOUR CONSULTING SEQUENCE</p><h2>Challenge reliability before release.</h2><p>Your assumptions stay saved. Next, trace a failure and design a controlled recovery.</p><a class="button" href="#failure">Continue →</a>'));}
 if(page==='opportunity')opportunityExperience(root);
 if(page==='capstone')capstoneExperience(root,state,save);
 if(page==='course')courseExperience(root);
 if(page==='scores')readinessExperience(root);
 if(['case','map','opportunity','failure','capstone'].includes(page))activityReviewExperience(root,route,state,save);
 for(const feedback of root.querySelectorAll('.feedback'))feedbackExperience(feedback);
 enhanceReviews(root,state,save);
}

export function dashboardView(state){
 const ready=readiness(state),done=lessons.filter(l=>lessonMastered(state,l.id)).length,next=lessons.find(l=>!lessonMastered(state,l.id))||lessons[0];
 const all=competency(state),gaps=all.filter(s=>!s.assessed||s.score<75).slice(0,3);
 const recent=Object.entries(state.assessments).filter(([,r])=>r.history?.length).slice(-3).reverse();
 return dashboardMarkup(state,ready,done,next,gaps,recent);
}

function selectDecisions(form,state,save=()=>{}){
 const selects=[...form.querySelectorAll('select[data-field]')];
 selects.forEach((select,i)=>{const field=select.closest('.field'),prompt=field.querySelector('span').textContent,deck=make('fieldset','professional-choice');deck.innerHTML='<legend>'+e(prompt)+'</legend>'+(field.querySelector('small')?'<p class="recommendation-context">'+e(field.querySelector('small').textContent)+'</p>':'');const options=[...select.options].filter(o=>o.value!=='');options.forEach((o,j)=>{const label=make('label','choice recommendation','<input type="radio" name="consulting-'+i+'" value="'+e(o.value)+'" '+(select.value===o.value?'checked':'')+'><span><small class="recommendation-label">APPROACH '+String.fromCharCode(65+j)+'</small>'+e(o.textContent)+'</span>');label.querySelector('input').addEventListener('input',ev=>{select.value=ev.target.value;select.dispatchEvent(new Event('input',{bubbles:true}));});deck.append(label);});field.hidden=true;field.after(deck);});
 const decks=[...form.querySelectorAll('.professional-choice')];if(!decks.length)return;
 const grouping=make('div','consulting-deck');decks[0].before(grouping);decks.forEach(d=>grouping.append(d));
 const nav=make('div','decision-controls','<button type="button" class="button secondary" data-rec-prev>← Previous</button><span role="status"></span><button type="button" class="button" data-rec-next>Next recommendation →</button>');grouping.after(nav);const kind=form.dataset.submit||'capstone',scope=form.dataset.decisionScope||kind+(form.dataset.id?':'+form.dataset.id:'')+(kind==='consequence'?'@'+(Number(form.dataset.index)+1):'');let index=state?.experience.flow?.decisions?.[scope]||0;if(decks.length===1)nav.hidden=true;
 const submit=form.querySelector('button[type="submit"],button:not([type])');
 const show=i=>{index=Math.max(0,Math.min(decks.length-1,i));decks.forEach((d,j)=>d.hidden=j!==index);nav.querySelector('span').textContent=(index+1)+' / '+decks.length+' recommendations';nav.querySelector('[data-rec-prev]').disabled=index===0;nav.querySelector('[data-rec-next]').hidden=index===decks.length-1;nav.querySelector('[data-rec-next]').disabled=!selects[index].value;if(submit)submit.hidden=index!==decks.length-1;};show(index);
 nav.addEventListener('click',ev=>{if(ev.target.closest('[data-rec-next]'))show(index+1);if(ev.target.closest('[data-rec-prev]'))show(index-1);if(state){(flowState(state).decisions||={})[scope]=index;save();}animatePanel(grouping);});form.addEventListener('input',()=>show(index));
 form.noValidate=true;form.addEventListener('submit',ev=>{const missing=selects.findIndex(s=>!s.value);if(missing>=0){ev.preventDefault();ev.stopImmediatePropagation();show(missing);decks[missing].querySelector('input')?.focus();}},true);
}

function dashboardMarkup(state,ready,done,next,gaps,recent){
 const stations=[['01','Foundation','Understand the work','AI fundamentals · business analysis','course',done<4],['02','Practitioner','Design the improvement','Diagnosis · design · delivery','course',done>=4&&done<8],['03','Client-ready','Defend the business case','Client engagements · capstone','capstone',done===8]];
 const route=state.lastRoute==='start'?'start:useful':state.lastRoute,resume=programRoutes.includes(route)?route:starterUnits.some(u=>!state.experience.starter[u.id]?.submitted)?'start:'+starterUnits.find(u=>!state.experience.starter[u.id]?.submitted).id:'lesson:'+next.id,intro=starterUnits.find(u=>resume==='start:'+u.id),chapter=lessons.find(l=>resume==='lesson:'+l.id),headline=routeTitle(resume),objective=intro?.goal||chapter?.why||cases.find(c=>resume==='case:'+c.id)?.goal||'Continue your saved practical work and connect the evidence to a controlled business outcome.';
 const hero=`<section class="continue-chapter"><div><p class="eyebrow">CONTINUE LEARNING · ${intro?'GUIDED FOUNDATION':e(chapter?.stage||'CONSULTING PRACTICE')}</p><h2>${e(headline)}</h2><p>${e(objective)}</p><div class="chapter-meta">${intro?'<span>Guided orientation</span><span>Practice before assessment</span>':chapter?'<span>'+chapter.time+' minutes</span><span>Lesson '+(lessons.indexOf(chapter)+1)+' of 8</span><span>'+e(chapter.skill[0])+'</span>':'<span>Practical application</span><span>Your work stays saved</span>'}</div><a href="#${resume}" class="button light">Continue learning ${icon('automation')}</a><details class="optional-exploration"><summary>Optional exploration · first assessed chapter</summary><a href="#lesson:fit">AI is a tool, not the starting point</a></details></div><div class="chapter-art" aria-hidden="true"><div class="art-orbit"></div>${[['ai','Interpret'],['rules','Calculate'],['human','Decide']].map(([type,label])=>'<div class="art-node type-'+type+'">'+icon(type)+'<span>'+label+'</span></div>').join('')}</div></section>`;
 const readinessPanel=`<aside class="readiness-compass"><p class="eyebrow">YOUR CLIENT READINESS</p><div class="readiness-ring" data-readiness="${ready.overall??0}"><strong>${ready.overall===null?'—':ready.overall}<small>${ready.overall===null?'Not assessed':'Assessed skill average'}</small></strong></div><b>${ready.ready?'Ready to demonstrate':'Build practical evidence'}</b><p>${ready.assessedCount}/11 skills assessed · ${ready.evidenceCount} evidence sources</p><a href="#scores">View readiness requirements →</a></aside>`;
 const recentRows=recent.map(([key])=>{const [kind,id]=key.split(':'),l=lessons.find(l=>l.id===id),s=assessmentSummary(state,key);const route=kind==='assignment'?'lesson:'+id:id?kind+':'+id:kind;return `<a href="#${e(route)}"><span>${icon('output')}<b>${e(l?.title||key)}</b></span><small>First ${s.first.score} · Latest ${s.latest.score} /100</small><span>Review →</span></a>`;}).join('');
 return `<header class="dashboard-intro"><div><p class="eyebrow">YOUR CONSULTING JOURNEY</p><h1>A better process starts with you.</h1><p>Build the judgment to turn business problems into reliable improvements.</p></div><span class="program-label">FOUNDATION → CLIENT-READY</span></header><div class="dashboard-focus">${hero}${readinessPanel}</div><section class="journey-landscape"><div class="section-heading"><div><p class="eyebrow">THE PATH AHEAD</p><h2>From understanding to client confidence.</h2></div><span>${done}/8 lessons mastered</span></div><div class="journey-stations">${stations.map(([n,label,verb,detail,target,active])=>`<a class="journey-station ${active?'current':''}" href="#${target}"><span class="station-number">${n}</span><div><small>${active?'CURRENT STAGE':label.toUpperCase()}</small><h3>${verb}</h3><p>${detail}</p></div><span aria-hidden="true">↗</span></a>`).join('')}</div></section><div class="dashboard-practice"><section class="skills-panel"><p class="eyebrow">YOUR NEXT SKILL EVIDENCE</p><h2>Practice with purpose.</h2>${gaps.map(s=>`<a href="#scores" class="skill-practice">${icon(s.name==='Workflow Mapping'?'rules':'decision')}<div><b>${e(s.name)}</b><small>${s.assessed?s.score+'/100 · further practice needed':'Not assessed · build your first evidence'}</small></div><span>→</span></a>`).join('')||'<p>Your assessed skills meet the standard. Review remaining readiness gates.</p>'}<a href="#course" class="text-button">Explore the learning path →</a></section><section class="next-engagement"><p class="eyebrow">STEP INTO A CLIENT’S BUSINESS</p><h2>Follow the facts.<br>Find the real problem.</h2><p>A service request is waiting. What is actually slowing it down?</p><a href="#case:hvac" class="client-spotlight"><span class="client-monogram">CC</span><div><b>Carolina Comfort HVAC</b><small>22 people · 500 requests / month</small></div><span>↗</span></a><a href="#cases">Explore four client engagements →</a></section></div><section class="recent-work"><div><p class="eyebrow">RECENT PROGRESS</p><h2>Your evidence, retained.</h2></div>${recentRows||'<p>Your first assessed decision will appear here. Reading and guided exploration do not award competency points.</p>'}</section>`;
}

function feedbackExperience(panel){
 if(panel.classList.contains('decision-review'))return;
 const rubric=[...panel.querySelectorAll(':scope > .rubric-row')];if(rubric.length){const detail=make('details','rubric-reveal','<summary>Inspect the scoring breakdown · '+rubric.length+' criteria</summary>');rubric[0].before(detail);rubric.forEach(row=>detail.append(row));}
 const items=[...panel.querySelectorAll(':scope > details')];if(!items.length)return;
 items.forEach(d=>d.open=false);(items.find(d=>!d.classList.contains('rubric-reveal'))||items[0]).open=true;
 panel.addEventListener('toggle',ev=>{if(ev.target.open&&items.includes(ev.target))items.filter(d=>d!==ev.target).forEach(d=>d.open=false);},true);
 const head=panel.querySelector('.decision-stage');if(head)head.innerHTML='<b>01 Consequence</b><span>→</span><span>02 Evidence</span><span>→</span><span>03 Consultant reasoning</span>';
 items.forEach(d=>{d.classList.toggle('supported-outcome',Boolean(d.querySelector('summary .good')));const body=d.querySelector(':scope > div'),reason=body?.querySelector('.analysis-block:not(.evidence):not(.consequence):not(.lens)');if(!body)return;const consequence=body.querySelector('.consequence'),evidence=body.querySelector('.evidence');if(consequence)body.prepend(consequence);if(evidence&&consequence)consequence.after(evidence);if(reason){const detail=make('details','reasoning-reveal','<summary>Examine the consultant reasoning</summary>');reason.before(detail);detail.append(reason);const better=[...body.querySelectorAll(':scope > p')].filter(p=>/Better approach|When another/.test(p.textContent));better.forEach(p=>detail.append(p));}});
}

function interviewExperience(root,id,state,save){
 const client=cases.find(c=>c.id===id),room=root.querySelector('.discovery-session');if(!client||!room)return;
 const asked=state.interviews[id]?.asked||[],latest=client.questions.find(q=>q.id===asked.at(-1));
 const bank=room.querySelector('.question-bank'),previous=[...bank.querySelectorAll('[data-question]')].filter(b=>asked.includes(b.dataset.question)&&b.dataset.question!==asked.at(-1));if(previous.length){const history=make('details','conversation-history','<summary>Review explored topics · '+previous.length+'</summary>');previous.forEach(b=>history.append(b));bank.prepend(history);}
 const notes=room.querySelector(':scope > .field');if(notes){const detail=make('details','assessment-archive','<summary>Your discovery working notes</summary>');notes.before(detail);detail.append(notes);}
 const identity=make('header','interview-identity','<span class="stakeholder-avatar">'+e((latest?.role||'Client').slice(0,1))+'</span><div><p class="eyebrow">LIVE DISCOVERY SIMULATION</p><h3>'+e(latest?.role||'Begin with the process owner')+'</h3><p>'+e(client.name)+'</p></div><div class="discovery-meter"><strong>'+asked.length+' / 7</strong><small>evidence topics</small></div>');room.querySelector('h2').after(identity);
 const transcript=room.querySelector('.transcript'),messages=[...transcript.children];if(messages.length>2){const history=make('details','conversation-history','<summary>Earlier conversation · '+(asked.length-1)+' questions</summary>');messages.slice(0,-2).forEach(m=>history.append(m));transcript.prepend(history);}
 const board=room.querySelector('.evidence-board'),unknown=board?.querySelector('.unresolved-evidence');if(unknown){unknown.innerHTML='<h4>Still to investigate</h4><div class="unknown-topics">'+client.questions.filter(q=>!asked.includes(q.id)).map(q=>'<span>'+e(q.id)+'</span>').join('')+'</div>'+(asked.length===7?'<p>Verify reported estimates against representative transactions.</p>':'');}
 const interview=room.querySelector('.interview'),evidence=room.querySelector('.evidence-board');if(evidence){interview.append(evidence);evidence.querySelectorAll('details').forEach(d=>d.open=false);const last=evidence.querySelector('details:last-of-type');if(last)last.open=true;}
 const main=root.querySelector('main'),brief=root.querySelector('.client-dossier')?.parentElement;if(brief){const details=make('details','client-background','<summary>Inspect the company brief and source document</summary>');brief.before(details);details.append(brief);}
 room.querySelector('h2').textContent='Find the evidence behind the story.';
 const recommendation=main.querySelector('form[data-submit="case"]')?.closest('.card');if(recommendation){const scope='interview:'+id,show=i=>{room.hidden=i===1;recommendation.hidden=i===0;};show(state.experience.flow?.decisions?.[scope]||0);const next=make('button','button','Make my recommendation →');next.type='button';room.append(next);next.addEventListener('click',()=>{show(1);(flowState(state).decisions||={})[scope]=1;save();recommendation.querySelector('h2').tabIndex=-1;recommendation.querySelector('h2').focus();window.scrollTo({top:0,behavior:'instant'});});const back=make('button','text-button','Return to discovery');back.type='button';recommendation.prepend(back);back.addEventListener('click',()=>{show(0);(flowState(state).decisions||={})[scope]=0;save();});}
}

function workflowExperience(root,state,save){
 const compare=root.querySelector('.state-comparison');if(compare){const details=make('details','client-background','<summary>Compare current and future process boundaries</summary>');compare.before(details);details.append(compare);}
 const map=root.querySelector('.process-map');if(map){map.classList.add('workflow-canvas');map.setAttribute('aria-label','Editable future-state workflow');const caption=make('div','canvas-caption','<span>'+icon('trigger')+'APPROVED PROJECT RECEIVED</span><span>Sequence · ownership · exception control</span>');map.before(caption);
 const card=map.closest('.card'),grid=card.closest('.grid');grid.classList.add('workflow-layout');const context=grid.children[1];if(context){const detail=make('details','client-background','<summary>Process context and exception requirements</summary>');grid.after(detail);detail.append(context);}
 const instruction=card.querySelector(':scope > p');if(instruction){const help=make('details','notation-reference','<summary>How to design and assess this workflow</summary>');instruction.before(help);help.append(instruction);}
 const legend=card.querySelector('[aria-label="Workflow types"]');if(legend){const details=make('details','notation-reference','<summary>Process notation reference</summary>');legend.before(details);details.append(legend);}
 const form=card.querySelector('form'),toolbar=make('div','studio-tabs','<button type="button" class="button secondary" data-studio="design">01 Design the process</button><button type="button" class="button secondary" data-studio="gates">02 Protect the release</button>');card.querySelector('h2').after(toolbar);
 const next=make('button','button','Protect the release →');next.type='button';map.after(next);
 const show=mode=>{map.hidden=mode!=='design';next.hidden=mode!=='design';caption.hidden=mode!=='design';form.hidden=mode!=='gates';toolbar.querySelectorAll('[data-studio]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.studio===mode)));};show(state.experience.flow?.decisions?.['map:studio']===1||state.map.submitted?'gates':'design');next.addEventListener('click',()=>{show('gates');(flowState(state).decisions||={})['map:studio']=1;save();form.querySelector('legend')?.focus();});toolbar.addEventListener('click',ev=>{const b=ev.target.closest('[data-studio]');if(b){show(b.dataset.studio);(flowState(state).decisions||={})['map:studio']=b.dataset.studio==='gates'?1:0;save();animatePanel(card);}});
 }
}

function inspectFlow(figure){
 const title=figure.querySelector('figcaption>strong');if(title){const heading=make('h2','visual-concept-title',e(title.textContent));title.replaceWith(heading);}
 const nodes=[...figure.querySelectorAll('.flow-node')];if(!nodes.length)return;
 const insight=make('div','flow-insight');insight.setAttribute('role','status');figure.append(insight);
 const show=i=>{nodes.forEach((node,j)=>{node.classList.toggle('inspected',i===j);node.querySelector('button').setAttribute('aria-pressed',String(i===j));});const type=[...nodes[i].classList].find(c=>c.startsWith('type-'))?.slice(5)||'system';insight.innerHTML=icon(type)+'<div><b>'+e(notation[type]?.[0]||type)+'</b><p>'+e(notation[type]?.[1]||'Inspect the responsibility before continuing.')+'</p></div>';};
 nodes.forEach((node,i)=>{const label=node.querySelector('b')?.textContent||node.textContent,button=make('button','inspect-node','Inspect responsibility ↗');button.setAttribute('aria-label','Inspect '+label);button.type='button';button.addEventListener('click',()=>{show(i);animatePanel(insight);});node.append(button);});show(0);
}

function failureExperience(root,state){
 const canvas=root.querySelector('.incident-canvas');if(!canvas)return;
 const paths=[...canvas.querySelectorAll('figure')];if(paths.length<2)return;
 const repair=make('button','button secondary','Compare the repaired process →');repair.type='button';let fixed=Boolean(state.failure.submitted&&gradeFailure(state.failure).score>=75);paths[0].hidden=fixed;paths[1].hidden=!fixed;repair.textContent=fixed?'Inspect the failure chain →':'Compare the repaired process →';canvas.append(repair);
 const trace=make('button','button secondary','Trace the next event →');trace.type='button';const status=make('p','trace-status');status.setAttribute('role','status');canvas.append(trace,status);let event=0;
 const highlight=()=>{const nodes=[...paths[fixed?1:0].querySelectorAll('.flow-node')];nodes.forEach((node,i)=>node.classList.toggle('trace-active',i===event%nodes.length));status.textContent='Event '+(event%nodes.length+1)+' / '+nodes.length+' · '+nodes[event%nodes.length].querySelector('b').textContent;};trace.addEventListener('click',()=>{event++;highlight();animatePanel(paths[fixed?1:0]);});highlight();
 repair.addEventListener('click',()=>{fixed=!fixed;event=0;paths[0].hidden=fixed;paths[1].hidden=!fixed;repair.textContent=fixed?'Inspect the failure chain →':'Compare the repaired process →';highlight();animatePanel(canvas);});
 const timeline=root.querySelector('.incident-log');if(timeline){const detail=make('details','client-background','<summary>Open the incident timeline and source evidence</summary>');timeline.before(detail);detail.append(timeline);}
}

function workbenchExperience(root){
 const grid=root.querySelector('.assumption-sheet .form-grid');if(!grid)return;
 const groups=[['Workload & time',['frequency','current','future','hourly']],['Investment & operations',['implementation','training','software','maintenance','api']],['Realization & evidence',['realization','errors']]];
 const tabs=make('div','workbench-tabs');const panels=groups.map(([label,keys],i)=>{const panel=make('div','assumption-group');keys.forEach(key=>{const field=grid.querySelector('[data-field="roi.'+key+'"]').closest('.field');panel.append(field);});const b=make('button','button secondary',label);b.type='button';b.dataset.assumptionGroup=i;tabs.append(b);return panel;});grid.before(tabs);grid.replaceChildren(...panels);
 const show=i=>panels.forEach((p,j)=>{p.hidden=i!==j;tabs.children[j].setAttribute('aria-pressed',String(i===j));});show(0);tabs.addEventListener('click',ev=>{const b=ev.target.closest('[data-assumption-group]');if(b){show(Number(b.dataset.assumptionGroup));animatePanel(grid);}});
}

function capstoneExperience(root,state,save){
 const form=root.querySelector('form[data-submit="capstone"]');if(!form)return;
 const panels=[...form.querySelectorAll(':scope > .deliverable,:scope > .card')],actions=form.querySelector(':scope > .actions');
 panels.filter(p=>p.matches('.card')).forEach(p=>{p.dataset.decisionScope='capstone:decisions';selectDecisions(p,state,save);});
 const nav=make('nav','engagement-stage-nav');nav.setAttribute('aria-label','Engagement deliverables');
 panels.forEach((p,i)=>{const title=p.querySelector('summary,h2').textContent.replace(/To draft|Drafted/g,'').trim();const b=make('button','engagement-step',e(title));b.type='button';b.dataset.engagementStage=i;nav.append(b);if(p.matches('details'))p.open=true;});const optional=make('details','optional-exploration','<summary>Optional exploration · engagement deliverables</summary>');form.before(optional);optional.append(nav);
 const controls=make('div','decision-controls','<button class="button secondary" type="button" data-engagement-back>← Previous</button><span role="status"></span><button class="button" type="button" data-engagement-next>Next deliverable →</button>');form.append(controls);let index=state.experience.flow?.decisions?.['capstone:stage']||0;
 const show=i=>{index=Math.max(0,Math.min(panels.length-1,i));panels.forEach((p,j)=>p.hidden=j!==index);nav.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-current',j===index?'step':'false'));controls.querySelector('span').textContent=(index+1)+' / '+panels.length+' engagement stages';controls.querySelector('[data-engagement-back]').disabled=index===0;controls.querySelector('[data-engagement-next]').hidden=index===panels.length-1;actions.hidden=index!==panels.length-1;};show(index);
 nav.addEventListener('click',ev=>{const b=ev.target.closest('[data-engagement-stage]');if(b){show(Number(b.dataset.engagementStage));(flowState(state).decisions||={})['capstone:stage']=index;save();animatePanel(form);}});controls.addEventListener('click',ev=>{if(ev.target.closest('[data-engagement-next]'))show(index+1);if(ev.target.closest('[data-engagement-back]'))show(index-1);(flowState(state).decisions||={})['capstone:stage']=index;save();animatePanel(form);});show(index);
 const standard=root.querySelector('.assessment-standard');if(standard){const detail=make('details','client-background','<summary>Inspect the published assessment standard</summary>');standard.before(detail);detail.append(standard);}
}

function opportunityExperience(root){
 const grid=root.querySelector('.card .form-grid');if(!grid)return;
 const groups=[['Business value',['frequency','labor','cost','error','return']],['Process feasibility',['repetition','standard','data']],['Delivery constraints',['judgment','risk','exceptions','complexity']]];
 const tabs=make('div','workbench-tabs'),panels=groups.map(([label,keys],i)=>{const panel=make('div','opportunity-assumptions');keys.forEach(key=>{const input=grid.querySelector('[data-field="opportunity.'+key+'"]');if(input)panel.append(input.closest('.field'));});const b=make('button','button secondary',label);b.type='button';b.dataset.factorGroup=i;tabs.append(b);return panel;});grid.before(tabs);grid.replaceChildren(...panels);
 const show=i=>panels.forEach((p,j)=>{p.hidden=i!==j;tabs.children[j].setAttribute('aria-pressed',String(i===j));});show(0);tabs.addEventListener('click',ev=>{const b=ev.target.closest('[data-factor-group]');if(b){show(Number(b.dataset.factorGroup));animatePanel(grid);}});
}


function courseExperience(root){
 const main=root.querySelector('main'),heading=main.querySelector('.page-title');if(heading)main.prepend(heading);
 const roadmap=[...main.querySelectorAll('.module.roadmap')];if(roadmap.length){const later=make('details','planned-study','<summary>Explore planned deeper modules</summary>');roadmap[0].before(later);roadmap.forEach(m=>later.append(m));}
 const checkpoints=main.querySelector('.readiness-canvas');if(checkpoints){const details=make('details','client-background','<summary>Inspect readiness checkpoints · assessed evidence</summary>');checkpoints.before(details);details.append(checkpoints);}
 const introductory=[...main.querySelectorAll(':scope>.card')].find(c=>c.querySelector('h2')?.textContent==='AI Start Here');if(introductory){const p=introductory.querySelector('p');p.textContent='Build the vocabulary before your first assessed consulting decision.';}
}

function starterExperience(root,id,state,save){
 const unit=starterUnits.find(u=>u.id===id)||starterUnits[0],main=root.querySelector('main'),cards=[...main.querySelectorAll(':scope>.card')];if(cards.length<2)return;
 const flow=flowState(state);flow.guided||={};const draft=state.experience.starter[unit.id]||{};
 let stage=flow.guided[unit.id]??(draft.submitted?3:0),busy=false;
 const [concept,decision]=cards,review=decision.querySelector('.decision-review');
 const panels=guidedStages.map((label,i)=>make('section','guided-screen','<p class="eyebrow">'+e(label.toUpperCase())+'</p>'));
 panels.forEach((p,i)=>p.dataset.guidedStage=i);
 const visuals=[...concept.children].filter(el=>el.matches('figure,.method-comparison,.visual-lab,.connection-comparison'));
 panels[0].append(concept);const first=visuals.shift();if(first)concept.querySelector('h2').after(first);
 const businesses={useful:['A buyer receives an unclear delivery email.',['Supplier email','Source-linked summary','Buyer verifies date']],instructions:['A proposal needs an agreed scope before it can promise delivery.',['Owner goal','Approved scope','Bounded proposal']],data:['Solar quantities use approved dimensions; unusual supplier notes need interpretation.',['Approved dimensions','Tested formula','Qualified review']],connections:['A service company copies CRM customer details into scheduling.',['Stable customer ID','Supported connection','Verified job record']],agents:['A buyer needs supplier-status recommendations, without giving away purchase authority.',['Approved updates','Read-only assistant','Buyer decision']],knowledge:['Staff need answers from policies that change over time.',['Current policy','Source retrieval','Reviewed answer']]};
 const [situation,steps]=businesses[unit.id];panels[1].append(make('div','business-stage','<h2>See the boundary inside a business.</h2><p>'+e(situation)+'</p>'+teachingFlow('From information to a controlled result',steps.map((s,i)=>[i===0?'system':i===1?({data:'rules',connections:'automation',instructions:'human'}[unit.id]||'ai'):'human',s]))));
 visuals.forEach(v=>{const detail=make('details','concept-notebook','<summary>Inspect or change a business boundary</summary>');panels[1].append(detail);detail.append(v);});
 concept.querySelector(':scope>h2')?.remove();concept.querySelector(':scope>.eyebrow')?.remove();concept.classList.remove('card');concept.querySelector(':scope>.lead')?.remove();
 decision.querySelectorAll('.actions').forEach(a=>a.remove());if(review){panels[3].replaceChildren(review);}
 panels[2].append(make('p','stage-reason','YOUR TASK · '+unit.goal),decision);decision.querySelector('h2').textContent='Make your recommendation.';
 const submit=decision.querySelector('form button:not([type]),form [type=submit]');if(submit)submit.textContent='Check my decision →';
 if(!review)panels[3].append(make('p','','Submit a recommendation to see its outcome.'));
 const next=nextProgramRoute('start:'+unit.id),nextUnit=starterUnits.find(u=>next==='start:'+u.id);
 panels[4].append(make('div','completion-stage','<h2>You have practiced the boundary.</h2><p class="eyebrow">WHAT YOU LEARNED</p><p>'+e(unit.goal)+'</p><p class="eyebrow">SKILL EVIDENCE</p><p>Guided practice recorded. Scored decisions and practical assignments will establish competency.</p><p class="eyebrow">WHAT COMES NEXT</p><p>'+e(nextUnit?.title||'Apply the building blocks to a mixed workflow.')+'</p><a class="button" href="#'+next+'">Continue →</a>'));
 const nav=main.querySelector('.starter-nav');if(nav){const optional=make('details','optional-exploration','<summary>Optional exploration · introductory course map</summary>');nav.before(optional);optional.append(nav);}
 const heading=main.querySelector('.page-title h1');heading.textContent=unit.title;main.querySelector('.subtitle').textContent='WHY THIS MATTERS · '+unit.goal;
 const status=make('p','linear-position');status.setAttribute('role','status');main.querySelector('.page-title').after(status);
 const footer=make('nav','stage-footer','<button type="button" class="button secondary" data-guided-back>← Back</button><button type="button" class="button" data-guided-next>Continue →</button>');
 const restart=make('button','text-button guided-restart','Restart this lesson');restart.type='button';restart.dataset.action='restart-lesson';restart.dataset.lesson='start:'+unit.id;
 main.append(...panels,footer,restart);
 const show=(focus=false)=>{flow.guided[unit.id]=stage;panels.forEach((p,i)=>p.hidden=i!==stage);status.textContent=(stage+1)+' / 5 · '+guidedStages[stage];footer.querySelector('[data-guided-back]').hidden=stage===0;footer.querySelector('[data-guided-next]').hidden=stage>=2;footer.hidden=stage===3||stage===4;footer.querySelector('[data-guided-next]').textContent=stage===1?'Make my decision →':'Continue →';if(focus){const target=panels[stage].querySelector('h2,h3')||panels[stage];target.tabIndex=-1;target.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}};
 const go=async n=>{if(busy||n<0||n>4)return;busy=true;footer.querySelectorAll('button').forEach(b=>b.disabled=true);await transitionScreen(panels[stage],()=>{stage=n;show(true);},()=>panels[stage]);save();busy=false;footer.querySelectorAll('button').forEach(b=>b.disabled=false);};
 footer.addEventListener('click',ev=>{if(ev.target.closest('[data-guided-next]'))go(stage+1);if(ev.target.closest('[data-guided-back]'))go(stage-1);});
 panels[3].addEventListener('reviewcomplete',()=>go(4));
 decision.querySelector('form').addEventListener('submit',ev=>{if(!ev.defaultPrevented){flow.guided[unit.id]=3;delete flow.reviews?.['starter:'+unit.id];}});
 if(first?.matches('.method-comparison'))methods(first,{},save);
 show();
}

function guidedWorkshop(root,state,save){
 const main=root.querySelector('main'),panels=[...main.querySelectorAll(':scope>.card')];if(panels.length!==3)return;
 const tabs=make('nav','studio-tabs');tabs.setAttribute('aria-label','Guided workshop stages');
 ['01 Classify the process','02 Explain the recommendation','03 Choose a tool category'].forEach((label,i)=>{const b=make('button','button secondary',label);b.type='button';b.dataset.workshopStage=i;tabs.append(b);});
 const optional=make('details','optional-exploration','<summary>Optional exploration · workshop activities</summary>');panels[0].before(optional);optional.append(tabs);
 const show=i=>panels.forEach((p,j)=>{p.hidden=i!==j;tabs.children[j].setAttribute('aria-pressed',String(i===j));});
 show(state.experience.flow?.decisions?.['start:practice']??(state.experience.conversation?.answer!==undefined?1:0));
 const advance=async i=>{await transitionScreen(main,()=>{show(i);(flowState(state).decisions||={})['start:practice']=i;const heading=panels[i].querySelector('h2');heading.tabIndex=-1;heading.focus();window.scrollTo({top:0,behavior:'instant'});},()=>panels[i]);save();};
 tabs.addEventListener('click',ev=>{const b=ev.target.closest('[data-workshop-stage]');if(b){show(Number(b.dataset.workshopStage));animatePanel(panels[Number(b.dataset.workshopStage)]);}});
 const classification=panels[0].querySelector('form');if(classification)selectDecisions(classification,state,save);
 const legend=panels[0].querySelector('.type-legend');if(legend){const detail=make('details','client-background','<summary>Inspect the work-type key</summary>');legend.before(detail);detail.append(legend);}
 panels.slice(0,2).forEach((panel,i)=>{const review=panel.querySelector('.decision-review');if(!review)return;const work=make('div','workshop-task');[...panel.children].filter(n=>n!==review).forEach(n=>work.append(n));panel.prepend(work);const mode=state.experience.flow?.activities?.[i?'conversation:0':'classification'];work.hidden=mode!=='work';review.hidden=mode==='work';review.addEventListener('reviewcomplete',()=>advance(i+1));const revise=make('button','text-button','Try another recommendation');revise.type='button';review.append(revise);revise.addEventListener('click',()=>{review.hidden=true;work.hidden=false;(flowState(state).activities||={})[i?'conversation:0':'classification']='work';save();});panel.querySelector('form').addEventListener('submit',()=>{(flowState(state).activities||={})[i?'conversation:0':'classification']='review';});});
 const actions=main.querySelector(':scope>.actions');if(actions)actions.remove();panels[2].append(make('a','button','Continue →'));panels[2].lastElementChild.href='#lesson:fit';
}
function readinessExperience(root){
 const main=root.querySelector('main'),next=[...main.querySelectorAll(':scope>.card')].find(c=>c.querySelector('h2')?.textContent==='Your next evidence');if(next)for(const p of next.querySelectorAll(':scope>p')){const label=p.querySelector('b');if(!label)continue;const detail=make('details','readiness-action','<summary>'+e(label.textContent.replace(/:$/,''))+'</summary>');p.before(detail);label.remove();detail.append(p);}
}

function activityReviewExperience(root,route,state,save){
 const main=root.querySelector('main'),reviews=[...main.querySelectorAll('.decision-review')],review=route.startsWith('case:')?reviews.at(-1):reviews[0];if(!review)return;
 const [page,id]=route.split(':'),submitted=page==='case'?state.cases[id]?.submitted:state[page]?.submitted;if(!submitted)return;
 const flow=flowState(state);flow.activities||={};let mode=flow.activities[route]||'review';
 const stage=make('section','activity-review-stage'),completion=make('section','completion-stage activity-completion','<p class="eyebrow">PRACTICE COMPLETE · '+e(routeTitle(route))+'</p><h2>Your recommendation is supported.</h2><p class="eyebrow">WHAT YOU LEARNED</p><p>'+e(({map:'You separated approved inputs, calculation, technical review and purchase authority.',failure:'You traced duplicate retries, reconciled the existing job and required a durable unique key.',opportunity:'You balanced business value, process feasibility and critical delivery risks.',capstone:'You defended diagnosis, design, business value and bounded implementation.'})[page]||cases.find(c=>c.id===id)?.goal||'Connect the evidence to a controlled business outcome.')+'</p><p class="eyebrow">SKILL EVIDENCE GAINED</p><p>'+e(competency(state).filter(s=>s.evidence.some(x=>x.key===route)).map(s=>s.name).join(' · ')||'No scored evidence recorded for this activity.')+' · First-attempt evidence remains retained.</p><p class="eyebrow">WHAT COMES NEXT</p><p>Continue your consulting sequence with '+e(routeTitle(nextProgramRoute(route)))+'.</p><a class="button" href="#'+nextProgramRoute(route)+'">Continue →</a>');
 stage.append(make('header','stage-heading','<p class="eyebrow">'+e(routeTitle(route))+'</p>'),review);const work=[...main.children];main.append(stage,completion);
 const show=()=>{work.forEach(node=>node.hidden=mode!=='work');stage.hidden=mode!=='review';completion.hidden=mode!=='complete';flow.activities[route]=mode;};
 stage.addEventListener('reviewcomplete',async()=>{await transitionScreen(stage,()=>{mode=activityComplete(state,route)?'complete':'work';show();const target=mode==='complete'?completion:main;target.tabIndex=-1;target.focus();window.scrollTo({top:0,behavior:'instant'});},()=>mode==='complete'?completion:main);save();});
 const revisit=make('button','text-button','Review or revise this activity');revisit.type='button';completion.append(revisit);revisit.addEventListener('click',()=>{mode='work';show();save();});show();
}
