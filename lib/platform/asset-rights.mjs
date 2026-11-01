const allowed=new Set(['review-required','approved','restricted','remove']);
export function validateAssetRights(manifest={}){
  if(manifest?.schemaVersion!==1||!Array.isArray(manifest.assets)||manifest.assets.length===0) throw new Error('Invalid asset-rights manifest.');
  const seen=new Set();
  const pending=[];
  for(const asset of manifest.assets){
    const path=String(asset?.path||'').trim();
    if(!path||seen.has(path)) throw new Error('Asset path missing or duplicate.');
    seen.add(path);
    if(!allowed.has(asset.rightsStatus)) throw new Error('Invalid rights status.');
    if(asset.rightsStatus==='approved'){
      for(const key of ['source','owner','evidence']) if(!String(asset[key]||'').trim()) throw new Error(`Approved asset requires ${key}.`);
    } else pending.push(path);
  }
  return {ready:pending.length===0,pending};
}
