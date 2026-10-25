const requiredDate=(env,key,label)=>({key,label,ok:/^20\d{2}-\d{2}-\d{2}(?:T.*Z)?$/.test(String(env[key]||'')),value:String(env[key]||'')});
const requiredText=(env,key,label)=>({key,label,ok:String(env[key]||'').trim().length>0,value:String(env[key]||'')});
const positiveNumber=(env,key,label)=>{const value=Number(env[key]);return {key,label,ok:Number.isFinite(value)&&value>0,value:env[key]};};
const requiredSha=(env,key,label)=>{const value=String(env[key]||'').trim();return {key,label,ok:/^[0-9a-f]{40}$/i.test(value),value};};
const requiredHttpsUrl=(env,key,label)=>{const value=String(env[key]||'').trim();let ok=false;try{const url=new URL(value);ok=url.protocol==='https:'&&url.username===''&&url.password==='';}catch{}return {key,label,ok,value};};
const equalsReleaseSha=(env,key,label)=>{const value=String(env[key]||'').trim();const release=String(env.BATIC_RELEASE_SHA||'').trim();return {key,label,ok:/^[0-9a-f]{40}$/i.test(value)&&value===release,value};};

export function productionReadiness(env=process.env) {
  const checks=[
    requiredSha(env,'BATIC_RELEASE_SHA','SHA exato da release candidata'),
    requiredDate(env,'BATIC_STANDARDS_REVIEWED_AT','Matriz de normas revista e aplicabilidade validada'),
    requiredDate(env,'BATIC_SECURITY_RISK_REVIEWED_AT','Avaliação de risco de segurança revista'),
    requiredDate(env,'BATIC_PIA_REVIEWED_AT','PIA/DPIA revista quando aplicável'),
    requiredDate(env,'BATIC_PRIVACY_APPROVED_AT','Privacidade/base legal aprovada'),
    requiredText(env,'BATIC_RETENTION_POLICY_VERSION','Política de retenção aprovada'),
    requiredDate(env,'BATIC_RETENTION_POLICY_APPROVED_AT','Data de aprovação da política de retenção'),
    requiredDate(env,'BATIC_IAM_REVIEWED_AT','IAM revisto'),
    equalsReleaseSha(env,'BATIC_FIRESTORE_RULES_DEPLOYED_SHA','Firestore Rules implantadas no SHA da release'),
    equalsReleaseSha(env,'BATIC_STORAGE_RULES_DEPLOYED_SHA','Storage Rules implantadas no SHA da release'),
    positiveNumber(env,'BATIC_BACKUP_RPO_HOURS','RPO de backup definido'),
    positiveNumber(env,'BATIC_BACKUP_RTO_HOURS','RTO de recuperação definido'),
    requiredDate(env,'BATIC_BACKUP_RESTORE_TESTED_AT','Restauro testado'),
    requiredDate(env,'BATIC_RESPONSIVE_VALIDATED_AT','Responsividade validada'),
    requiredDate(env,'BATIC_ACCESSIBILITY_VALIDATED_AT','Acessibilidade validada'),
    requiredDate(env,'BATIC_USABILITY_VALIDATED_AT','Usabilidade validada'),
    requiredDate(env,'BATIC_REPOSITORY_GOVERNANCE_APPROVED_AT','Visibilidade/licença/ownership do repositório aprovados'),
    requiredDate(env,'BATIC_ASSET_RIGHTS_APPROVED_AT','Direitos/proveniência dos assets públicos aprovados'),
    equalsReleaseSha(env,'BATIC_PRODUCTION_DEPLOYED_SHA','Deployment de produção no SHA da release'),
    requiredHttpsUrl(env,'BATIC_PRODUCTION_DEPLOYMENT_URL','URL HTTPS do deployment de produção'),
    requiredDate(env,'BATIC_PRODUCTION_DOMAIN_VALIDATED_AT','Domínio público validado no deployment de produção'),
    requiredDate(env,'BATIC_ROLLBACK_VALIDATED_AT','Rollback validado para a release'),
    requiredText(env,'BATIC_READINESS_REVIEWER','Revisor responsável do readiness'),
    requiredHttpsUrl(env,'BATIC_READINESS_EVIDENCE_URL','URL HTTPS do registo consolidado de evidência'),
  ];
  return {ready:checks.every(check=>check.ok),checks,missing:checks.filter(check=>!check.ok).map(check=>check.key)};
}
