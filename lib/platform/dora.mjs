export function doraMetrics(events) {
  if(!Array.isArray(events)) throw new Error('events must be an array');
  const deployments=events.filter(event=>event?.type==='deployment'&&event.environment==='production'&&event.result==='success');
  const incidents=events.filter(event=>event?.type==='incident'&&event.environment==='production');
  const recoveries=new Map(events.filter(event=>event?.type==='recovery'&&event.environment==='production'&&event.incidentId).map(event=>[event.incidentId,event]));
  const sorted=[...deployments].sort((a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt));
  const deploymentCount=sorted.length;
  let leadTimes=[];
  for(const deployment of sorted){
    if(deployment.commitAt&&deployment.completedAt){
      const value=Date.parse(deployment.completedAt)-Date.parse(deployment.commitAt);
      if(Number.isFinite(value)&&value>=0) leadTimes.push(value/3600000);
    }
  }
  const failedDeploymentIds=new Set(incidents.map(item=>item.deploymentId).filter(Boolean));
  const changeFailureRate=deploymentCount?failedDeploymentIds.size/deploymentCount:null;
  const recoveryHours=[];
  for(const incident of incidents){
    const recovery=recoveries.get(incident.id);
    if(!recovery) continue;
    const delta=Date.parse(recovery.restoredAt)-Date.parse(incident.startedAt);
    if(Number.isFinite(delta)&&delta>=0) recoveryHours.push(delta/3600000);
  }
  const deploymentIntervalsHours=[];
  for(let i=1;i<sorted.length;i++) deploymentIntervalsHours.push((Date.parse(sorted[i].completedAt)-Date.parse(sorted[i-1].completedAt))/3600000);
  const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
  return {
    productionDeployments:deploymentCount,
    meanLeadTimeHours:mean(leadTimes),
    meanTimeToRestoreHours:mean(recoveryHours),
    changeFailureRate,
    meanDeploymentIntervalHours:mean(deploymentIntervalsHours),
  };
}
