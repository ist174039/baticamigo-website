const definitions={
  assignment:{classification:'restricted',retentionCategory:'records'},
  material:{classification:'restricted',retentionCategory:'records'},
  document:{classification:'restricted',retentionCategory:'documents'},
  message:{classification:'restricted',retentionCategory:'messages'},
  assessment:{classification:'highly-restricted',retentionCategory:'records'},
  justification:{classification:'highly-restricted',retentionCategory:'records'},
};
export function recordGovernance(kind) {
  const value=definitions[kind];
  if(!value) throw new Error('Unknown record kind.');
  return {...value};
}
export const governedRecordKinds=Object.freeze(Object.keys(definitions));
