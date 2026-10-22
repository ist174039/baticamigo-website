import test from 'node:test';
import assert from 'node:assert/strict';
import {areaModules,defaultAccessProfiles,defaultAreasForRoles,effectiveAccountAreas,validateAccessProfiles,validateAreaModules} from '../../lib/platform/access.mjs';

test('access profiles inherit the union of their configured menus',()=>{
  const profiles={...defaultAccessProfiles,member:['overview','finance'],volunteer:['overview','sessions']};
  const normalized=validateAccessProfiles(profiles);
  assert.deepEqual(defaultAreasForRoles(['member','volunteer'],normalized),['overview','sessions','finance']);
});

test('administrator access profile always retains every platform menu',()=>{
  const profiles={...defaultAccessProfiles,admin:['overview']};
  assert.equal(validateAccessProfiles(profiles),null);
  assert.deepEqual(defaultAreasForRoles(['admin'],defaultAccessProfiles),areaModules);
});

test('invalid access profile permissions fail closed',()=>{
  assert.equal(validateAccessProfiles({...defaultAccessProfiles,member:['overview','unknown']}),null);
  assert.equal(validateAccessProfiles({...defaultAccessProfiles,coordinator:['finance','reports']}),null);
  assert.equal(validateAreaModules(['overview','unknown']),null);
});

test('legacy account menu restrictions remain bounded until the association configures profiles',()=>{
  const restricted=effectiveAccountAreas(['member'],['overview','finance','sessions']);
  assert.deepEqual(restricted.modules,['overview','finance']);
  assert.equal(restricted.invalidLegacy,false);
  assert.deepEqual(effectiveAccountAreas(['member'],['overview','finance'],defaultAccessProfiles,true).modules,defaultAreasForRoles(['member']));
  assert.equal(effectiveAccountAreas(['member'],['overview','unknown']).invalidLegacy,true);
});
