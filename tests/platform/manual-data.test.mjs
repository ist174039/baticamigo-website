import test from 'node:test';
import assert from 'node:assert/strict';
import {manualGuides} from '../../lib/platform/manual-data.mjs';
import {areaModules,accessProfileIds} from '../../lib/platform/access.mjs';
test('manual has unique guides and covers every visible platform module',()=>{
 const ids=manualGuides.map(g=>g.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const module of areaModules)assert.ok(manualGuides.some(g=>g.module===module)||['material','justification','document','notifications','progress'].includes(module),'Missing manual module '+module);
});
test('manual has complete actionable steps and role mapping',()=>{
 for(const guide of manualGuides){
   assert.ok(guide.location.startsWith('/'));
   assert.ok(guide.steps.length>=4,guide.id);
   assert.equal(guide.decision.length,3,guide.id);
   assert.ok(guide.roles.every(r=>accessProfileIds.includes(r)),guide.id);
   for(const step of guide.steps)assert.ok(step.length===4&&step.every(s=>s.length>=3),guide.id);
 }
});
