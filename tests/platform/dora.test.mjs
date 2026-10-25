import test from 'node:test';
import assert from 'node:assert/strict';
import {doraMetrics} from '../../lib/platform/dora.mjs';

test('DORA metrics are derived only from verified production ledger events',()=>{
  const metrics=doraMetrics([
    {type:'deployment',id:'d1',environment:'production',result:'success',commitAt:'2026-01-01T08:00:00Z',completedAt:'2026-01-01T10:00:00Z'},
    {type:'deployment',id:'preview',environment:'preview',result:'success',commitAt:'2026-01-01T08:00:00Z',completedAt:'2026-01-01T09:00:00Z'},
    {type:'deployment',id:'d2',environment:'production',result:'success',commitAt:'2026-01-02T08:00:00Z',completedAt:'2026-01-02T11:00:00Z'},
    {type:'incident',id:'i1',deploymentId:'d2',environment:'production',startedAt:'2026-01-02T11:30:00Z'},
    {type:'recovery',incidentId:'i1',environment:'production',restoredAt:'2026-01-02T12:30:00Z'},
  ]);
  assert.equal(metrics.productionDeployments,2);
  assert.equal(metrics.meanLeadTimeHours,2.5);
  assert.equal(metrics.meanTimeToRestoreHours,1);
  assert.equal(metrics.changeFailureRate,.5);
  assert.equal(metrics.meanDeploymentIntervalHours,25);
});
test('DORA metrics do not fabricate values when there is no production evidence',()=>{
  assert.deepEqual(doraMetrics([]),{
    productionDeployments:0,meanLeadTimeHours:null,meanTimeToRestoreHours:null,changeFailureRate:null,meanDeploymentIntervalHours:null
  });
});
