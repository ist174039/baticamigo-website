const categories=['audit','records','messages','documents','attendance','sessions','profiles','finance'];

export function validateRetentionPolicy(policy) {
  if(!policy||typeof policy!=='object'||Array.isArray(policy)) throw new Error('Retention policy must be an object.');
  if(typeof policy.version!=='string'||!policy.version.trim()) throw new Error('Retention policy version is required.');
  if(typeof policy.approvedAt!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(policy.approvedAt)) throw new Error('Retention policy approval date is required.');
  if(!policy.categories||typeof policy.categories!=='object'||Array.isArray(policy.categories)) throw new Error('Retention categories are required.');
  const normalized={version:policy.version.trim(),approvedAt:policy.approvedAt,categories:{}};
  for(const category of categories) {
    const item=policy.categories[category];
    if(!item||typeof item!=='object'||Array.isArray(item)) throw new Error(`Retention category missing: ${category}`);
    const days=Number(item.days);
    if(!Number.isInteger(days)||days<1||days>36500) throw new Error(`Invalid retention days for ${category}`);
    if(typeof item.owner!=='string'||!item.owner.trim()) throw new Error(`Retention owner missing: ${category}`);
    normalized.categories[category]={days,owner:item.owner.trim(),legalHold:Boolean(item.legalHold)};
  }
  return normalized;
}

export function retentionCutoff(policy,category,now=new Date()) {
  const normalized=validateRetentionPolicy(policy);
  const item=normalized.categories[category];
  if(!item) throw new Error('Unknown retention category.');
  if(item.legalHold) return null;
  return new Date(now.getTime()-item.days*86400000).toISOString();
}

export const retentionCategories=[...categories];
