const requiredDate=(env,key,label)=>({key,label,ok:/^20\d{2}-\d{2}-\d{2}(?:T.*Z)?$/.test(String(env[key]||'')),value:String(env[key]||'')});
const requiredText=(env,key,label)=>({key,label,ok:String(env[key]||'').trim().length>0,value:String(env[key]||'')});
const positiveNumber=(env,key,label)=>{const value=Number(env[key]);return {key,label,ok:Number.isFinite(value)&&value>0,value:env[key]};};

export function productionReadiness(env=process.env) {
  const checks=[
    requiredDate(env,'BATIC_STANDARDS_REVIEWED_AT','Matriz de normas revista e aplicabilidade validada'),
    requiredDate(env,'BATIC_SECURITY_RISK_REVIEWED_AT','Avaliação de risco de segurança revista'),
    requiredDate(env,'BATIC_PIA_REVIEWED_AT','PIA/DPIA revista quando aplicável'),
    requiredDate(env,'BATIC_PRIVACY_APPROVED_AT','Privacidade/base legal aprovada'),
    requiredText(env,'BATIC_RETENTION_POLICY_VERSION','Política de retenção aprovada'),
    requiredDate(env,'BATIC_IAM_REVIEWED_AT','IAM revisto'),
    requiredText(env,'BATIC_FIRESTORE_RULES_DEPLOYED_SHA','Firestore Rules implantadas e identificadas'),
    requiredText(env,'BATIC_STORAGE_RULES_DEPLOYED_SHA','Storage Rules implantadas e identificadas'),
    positiveNumber(env,'BATIC_BACKUP_RPO_HOURS','RPO de backup definido'),
    positiveNumber(env,'BATIC_BACKUP_RTO_HOURS','RTO de recuperação definido'),
    requiredDate(env,'BATIC_BACKUP_RESTORE_TESTED_AT','Restauro testado'),
    requiredDate(env,'BATIC_RESPONSIVE_VALIDATED_AT','Responsividade validada'),
    requiredDate(env,'BATIC_ACCESSIBILITY_VALIDATED_AT','Acessibilidade validada'),
    requiredDate(env,'BATIC_USABILITY_VALIDATED_AT','Usabilidade validada'),
  ];
  return {ready:checks.every(check=>check.ok),checks,missing:checks.filter(check=>!check.ok).map(check=>check.key)};
}
