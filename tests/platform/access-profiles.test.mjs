import test from 'node:test';
import assert from 'node:assert/strict';
import {areaModules,defaultAccessProfiles,defaultAreasForRoles,effectiveAccountAreas,sessionsWithAuthorizedAttendees,sharedCalendarMetadata,validateAccessProfiles,validateAreaModules} from '../../lib/platform/access.mjs';

test('access profiles inherit the union of their configured menus',()=>{
  const profiles={...defaultAccessProfiles,member:['overview','finance'],volunteer:['overview','sessions']};
  const normalized=validateAccessProfiles(profiles);
  assert.deepEqual(defaultAreasForRoles(['member','volunteer'],normalized),['overview','sessions','finance']);
});

test('every active profile retains the shared calendar even when its menu is removed from configuration or legacy account settings',()=>{
  const normalized=validateAccessProfiles({...defaultAccessProfiles,member:['overview','finance']});
  assert.ok(normalized.member.includes('sessions'));
  for(const role of ['admin','coordinator','student','guardian','tutor','volunteer','member']) assert.ok(defaultAreasForRoles([role],normalized).includes('sessions'));
  assert.ok(effectiveAccountAreas(['member'],['overview','finance'],normalized,true).modules.includes('sessions'));
  assert.ok(effectiveAccountAreas(['member'],['overview','finance']).modules.includes('sessions'));
});

test('shared calendar metadata hides unrelated participant and tutor identifiers and excludes it from attendance reads',()=>{
  const authorized={id:'own-session',title:'Sessão',room:'Sala A',startsAt:'2026-10-24T10:00:00Z',endsAt:'2026-10-24T11:00:00Z',status:'scheduled',recurrence:null,tutorId:'t1',studentIds:['s1']};
  const shared=sharedCalendarMetadata({...authorized,id:'other-session',tutorId:'t2',studentIds:['s2']});
  assert.deepEqual(shared,{id:'other-session',title:'Sessão',room:'Sala A',startsAt:'2026-10-24T10:00:00Z',endsAt:'2026-10-24T11:00:00Z',status:'scheduled',recurrence:null,studentIds:[]});
  assert.deepEqual(sessionsWithAuthorizedAttendees([shared,authorized]),[authorized]);
});

test('administrator access profile always retains every platform menu',()=>{
  const profiles={...defaultAccessProfiles,admin:['overview']};
  assert.equal(validateAccessProfiles(profiles),null);
  assert.deepEqual(defaultAreasForRoles(['admin'],defaultAccessProfiles),areaModules);
});

test('tutors and volunteers receive the justifications area to record planned absences',()=>{
  assert.ok(defaultAreasForRoles(['tutor']).includes('justification'));
  assert.ok(defaultAreasForRoles(['volunteer']).includes('justification'));
});

test('invalid access profile permissions fail closed',()=>{
  assert.equal(validateAccessProfiles({...defaultAccessProfiles,member:['overview','unknown']}),null);
  assert.equal(validateAccessProfiles({...defaultAccessProfiles,coordinator:['finance','reports']}),null);
  assert.equal(validateAreaModules(['overview','unknown']),null);
});

test('legacy account menu restrictions remain bounded until the association configures profiles',()=>{
  const restricted=effectiveAccountAreas(['member'],['overview','finance','sessions']);
  assert.deepEqual(restricted.modules,['overview','sessions','finance']);
  assert.equal(restricted.invalidLegacy,false);
  assert.deepEqual(effectiveAccountAreas(['member'],['overview','finance'],defaultAccessProfiles,true).modules,defaultAreasForRoles(['member']));
  assert.equal(effectiveAccountAreas(['member'],['overview','unknown']).invalidLegacy,true);
});
