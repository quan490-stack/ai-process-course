// Exactly two pilots. Ready is reserved for reviewed, rendered presenter media.
// No provider, API key or external request is involved in course playback.
const pilot=(lessonId,title,skillGained,competencies,takeaway,cues)=>({
 lessonId,title,status:'awaiting-production',duration:null,targetDuration:35,
 videoSource:null,plannedVideoSource:'/assets/recaps/'+lessonId+'/recap.mp4',
 posterSource:'/assets/recaps/'+lessonId+'/poster.svg',captionSource:null,
 plannedCaptionSource:'/assets/recaps/'+lessonId+'/captions.vtt',
 presenterId:'course-guide-01',skillGained,competencies,takeaway,cues,
 transcript:cues.map(c=>c[2]).join(' '),
});
export const videoRecaps={
 fit:pilot('fit','AI is a tool, not the starting point','Technology selection',['AI Knowledge','Solution Architecture'],'AI interprets. Rules calculate. Humans own judgment.',[
  [0,3,'Here’s what matters: start with the business problem.'],
  [3,7,'Then choose the tool. AI interprets ambiguous information.'],
  [7,11,'Approved rules handle repeatable calculations from verified inputs.'],
  [11,15,'In procurement, AI summarizes the original supplier email.'],
  [15,19,'Rules calculate quantity. A person checks substitutions and exceptions.'],
  [19,23,'An authorized buyer releases the current approved order.'],
  [23,27,'Keep interpretation, calculation, and purchase authority separate and visible.'],
  [27,31,'You’re building technology selection through AI Knowledge and Solution Architecture.'],
  [31,35,'Next, we’ll design controls for uncertainty, before a draft becomes a commitment.'],
 ]),
 reliability:pilot('reliability','Design for uncertainty','Risk & Governance · Automation Design',['AI Knowledge','Risk & Governance','Automation Design'],'Design the exception path alongside the normal path.',[
  [0,3,'Here’s what matters: a clear answer can still be wrong.'],
  [3,7,'Design for missing information, conflicting sources, and failure.'],
  [7,11,'Sending every invoice draft straight to an output is fragile.'],
  [11,15,'Validate fields and totals against the original source.'],
  [15,19,'Route uncertainty to a named reviewer.'],
  [19,23,'Keep a manual fallback before any business commitment.'],
  [23,27,'As a consultant, design the exception path alongside the normal path.'],
  [27,31,'You’re strengthening Risk and Governance and Automation Design.'],
  [31,35,'Next, use discovery to understand how the client’s process works.'],
 ]),
};
export const readyVideo=config=>config.status==='ready'&&Number.isFinite(config.duration)&&config.duration>=20&&config.duration<=45&&/^\/assets\/recaps\/[\w-]+\/recap\.(mp4|webm)$/.test(config.videoSource||'')&&/^\/assets\/recaps\/[\w-]+\/captions\.vtt$/.test(config.captionSource||'');
export function validVideoProgress(value){return Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([id,p])=>Object.hasOwn(videoRecaps,id)&&p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).every(k=>['time','status'].includes(k))&&Number.isFinite(p.time)&&p.time>=0&&p.time<=45&&['paused','finished','skipped'].includes(p.status)));}
