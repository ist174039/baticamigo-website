export function dependencyLicenseStatus(exceptions={}){
  if(exceptions?.schemaVersion!==1||!Array.isArray(exceptions.exceptions)) throw new Error('Invalid dependency-license exceptions.');
  const pending=[];
  for(const item of exceptions.exceptions){
    if(!item?.package||!item.version) throw new Error('Dependency-license exception requires package/version.');
    if(!['review-required','verified','approved','rejected'].includes(item.status)) throw new Error('Invalid dependency-license status.');
    if(['verified','approved'].includes(item.status)&&(!item.observedLicense||!Array.isArray(item.evidence)||item.evidence.length===0)) throw new Error('Verified/approved dependency license requires evidence.');
    if(item.status!=='approved') pending.push(`${item.package}@${item.version}`);
  }
  return {ready:pending.length===0,pending};
}
