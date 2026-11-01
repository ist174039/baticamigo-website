import {classifyIncident} from './incident.mjs';
export function validateTabletopPlan(plan={}){
  if(plan?.schemaVersion!==1||!Array.isArray(plan.scenarios)||plan.scenarios.length===0) throw new Error('Invalid incident tabletop plan.');
  const seen=new Set();
  for(const scenario of plan.scenarios){
    if(!scenario?.id||seen.has(scenario.id)) throw new Error('Incident scenario id invalid or duplicate.');
    seen.add(scenario.id);
    if(!scenario.title||!scenario.trigger||!Array.isArray(scenario.objectives)||scenario.objectives.length<3) throw new Error('Incident scenario incomplete.');
    if(classifyIncident(scenario.trigger)!==scenario.expectedSeverity) throw new Error('Incident scenario severity mismatch.');
  }
  return true;
}
export function tabletopExerciseStatus(plan={},evidence={}){
  validateTabletopPlan(plan);
  const required=Array.isArray(plan.requiredExerciseEvidence)?plan.requiredExerciseEvidence:[];
  const missing=required.filter(key=>{
    const value=evidence[key];
    return Array.isArray(value)?value.length===0:!String(value||'').trim();
  });
  return {ready:missing.length===0,missing};
}
