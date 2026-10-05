// Presentation only: these summaries do not introduce assessment evidence.
export const lessonRecaps={
 fit:{title:'The right work. The right method.',businessExample:'Solar procurement · from an unclear email to an approved order',steps:[
  {type:'system',label:'Supplier email',detail:'Preserve the original supplier communication as evidence.'},
  {type:'ai',label:'Interpret ambiguity',detail:'AI drafts a source-linked interpretation. The buyer verifies what the supplier actually confirmed.'},
  {type:'rules',label:'Calculate repeatable quantity',detail:'Approved inputs and a tested formula produce the required quantity.'},
  {type:'human',label:'Review the exception',detail:'A qualified reviewer checks substitutions and compatibility against the current specification.'},
  {type:'output',label:'Release approved order',detail:'The authorized buyer releases the current approved order. The system records and tracks it.'}
 ],consequence:'A fluent interpretation never becomes calculation or purchase authority.',takeaway:'AI interprets. Rules calculate. Humans own judgment.',skillGained:'Technology selection'},
 reliability:{title:'A clear answer still needs a control.',businessExample:'Invoice processing · from a model draft to a verified record',steps:[
  {type:'system',label:'Preserve the source',detail:'Keep the original invoice and approved vendor record available for comparison.'},
  {type:'ai',label:'Propose the fields',detail:'AI extracts a draft. A well-formed answer is not proof that its contents are accurate.'},
  {type:'rules',label:'Validate and match',detail:'Check required fields, totals and identifiers against authoritative records.'},
  {type:'exception',label:'Stop on uncertainty',detail:'A conflicting bank-change note goes to a named reviewer. Missing evidence does not become a guessed fact.'},
  {type:'approval',label:'Approve within authority',detail:'Only an authorized person approves the consequential action after verification.'}
 ],consequence:'Correct formatting can hide a wrong business fact. Stop before an unsupported commitment.',takeaway:'Check the format. Verify the facts. Keep authority explicit.',skillGained:'Reliability and control design'}
};
export const recapFrameCount=config=>config.steps.length+(config.consequence?1:0)+2;
export const recapDuration=config=>recapFrameCount(config)*4000;
export function validRecaps(value){return Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([id,p])=>Object.hasOwn(lessonRecaps,id)&&p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).every(k=>['frame','status'].includes(k))&&Number.isInteger(p.frame)&&p.frame>=0&&p.frame<recapFrameCount(lessonRecaps[id])&&['ready','paused','finished'].includes(p.status)));}
