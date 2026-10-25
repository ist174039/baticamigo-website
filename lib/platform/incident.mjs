export const incidentSeverities={
  SEV1:{maxAckMinutes:15,description:'Indisponibilidade crítica, perda/exposição confirmada ou risco imediato para titulares.'},
  SEV2:{maxAckMinutes:60,description:'Degradação relevante, controlo de segurança comprometido sem impacto crítico confirmado.'},
  SEV3:{maxAckMinutes:240,description:'Incidente limitado, workaround disponível e sem impacto elevado confirmado.'},
  SEV4:{maxAckMinutes:1440,description:'Evento menor ou melhoria operacional sem impacto material.'},
};

export function classifyIncident({dataExposure=false,dataLoss=false,authBypass=false,serviceUnavailable=false,limitedDegradation=false}={}) {
  if(dataExposure||dataLoss||authBypass||serviceUnavailable) return 'SEV1';
  if(limitedDegradation) return 'SEV2';
  return 'SEV3';
}
