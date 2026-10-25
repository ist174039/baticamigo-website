const accessibilityResults=new Set(['passed','failed','blocked']);
const usabilityOutcomes=new Set(['complete','complete-with-help','failed']);
const severities=new Set(['critical','high','medium','low']);

function requiredText(value,key,max=500){
  const text=String(value?.[key]||'').trim();
  if(!text||text.length>max) throw new Error(`${key} is required.`);
  return text;
}
function date(value,key){
  const text=requiredText(value,key,80);
  if(!/^20\d{2}-\d{2}-\d{2}(?:T.*Z)?$/.test(text)) throw new Error(`${key} is invalid.`);
  return text;
}
export function validateAccessibilityExecution(value){
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error('Accessibility execution must be an object.');
  const result={
    id:requiredText(value,'id',80),version:requiredText(value,'version',80),environment:requiredText(value,'environment',120),
    executedAt:date(value,'executedAt'),executor:requiredText(value,'executor',160),reviewer:requiredText(value,'reviewer',160),
    surface:requiredText(value,'surface',120),browser:requiredText(value,'browser',120),viewport:requiredText(value,'viewport',80),
    assistiveTechnology:String(value.assistiveTechnology||'').trim(),zoom:requiredText(value,'zoom',40),
    result:requiredText(value,'result',20),acceptanceCriterion:requiredText(value,'acceptanceCriterion',1000),
    findings:Array.isArray(value.findings)?value.findings:[],artifact:requiredText(value,'artifact',500),
  };
  if(!accessibilityResults.has(result.result)) throw new Error('Accessibility result invalid.');
  for(const finding of result.findings){
    if(!finding?.id||!severities.has(finding.severity)||!finding.summary) throw new Error('Accessibility finding invalid.');
  }
  if(result.result==='passed'&&result.findings.some(item=>['critical','high'].includes(item.severity))) throw new Error('Accessibility execution cannot pass with critical/high findings.');
  return result;
}

export function validateUsabilitySession(value){
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error('Usability session must be an object.');
  const result={
    id:requiredText(value,'id',80),participantId:requiredText(value,'participantId',80),profile:requiredText(value,'profile',80),
    version:requiredText(value,'version',80),environment:requiredText(value,'environment',120),executedAt:date(value,'executedAt'),
    moderator:requiredText(value,'moderator',160),reviewer:requiredText(value,'reviewer',160),
    tasks:Array.isArray(value.tasks)?value.tasks:[],findings:Array.isArray(value.findings)?value.findings:[],
    artifact:requiredText(value,'artifact',500),
  };
  if(!/^synthetic-[a-z0-9_-]+$/i.test(result.participantId)) throw new Error('Use a synthetic participant ID.');
  if(!result.tasks.length) throw new Error('At least one usability task is required.');
  for(const task of result.tasks){
    if(!task?.id||!usabilityOutcomes.has(task.outcome)) throw new Error('Usability task invalid.');
    if(task.confidence!=null&&(!Number.isInteger(task.confidence)||task.confidence<1||task.confidence>5)) throw new Error('Usability confidence invalid.');
    if(task.comprehension!=null&&(!Number.isInteger(task.comprehension)||task.comprehension<1||task.comprehension>5)) throw new Error('Usability comprehension invalid.');
  }
  for(const finding of result.findings){
    if(!finding?.id||!severities.has(finding.severity)||!finding.summary) throw new Error('Usability finding invalid.');
  }
  return result;
}
