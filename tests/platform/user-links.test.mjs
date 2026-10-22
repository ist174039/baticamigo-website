import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLinks } from '../../lib/platform/user-links.mjs';

function firestoreMock(initialProfiles = [], initialAccounts = []) {
  const profiles = new Map(initialProfiles.map(([id, data]) => [id, data]));
  const accounts = new Map(initialAccounts.map(([id, data]) => [id, data]));
  const db = {
    collection(name) {
      return {
        doc(id) { return { collection: name, id, path: `${name}/${id}` }; },
        where(field, operator, value) { return { collection: name, field, operator, value }; },
      };
    },
  };
  const tx = {
    async get(ref) {
      if (ref.operator) {
        const docs = [...accounts.entries()]
          .filter(([, account]) => ref.collection === 'platform_accounts' && ref.field === 'profileIds' && ref.operator === 'array-contains' && account.profileIds?.includes(ref.value))
          .map(([id, data]) => ({ id, data: () => data }));
        return { docs, empty: docs.length === 0, size: docs.length };
      }
      const data = ref.collection === 'platform_profiles' ? profiles.get(ref.id) : undefined;
      return { exists: data !== undefined, data: () => data };
    },
  };
  const getCollection = (database, name) => database.collection(name === 'profiles' ? 'platform_profiles' : name === 'accounts' ? 'platform_accounts' : name);
  return { db, tx, getCollection };
}

const newProfile = (id, kind, overrides = {}) => ({
  id,
  ref: { collection: 'platform_profiles', id, path: `platform_profiles/${id}` },
  data: { kind, name: id, active: true, guardianIds: [], ...overrides },
});

test('validates and returns multiple new person profiles for one account', async () => {
  const { db, tx, getCollection } = firestoreMock([['guardian-1', { kind: 'guardian', active: true }]]);
  const drafts = [
    newProfile('student-new', 'student', { guardianIds: ['guardian-1'] }),
    newProfile('member-new', 'member'),
  ];
  const linked = await validateLinks(tx, db, 'account-1', ['student', 'member'], drafts.map((profile) => profile.id), drafts, getCollection);
  assert.deepEqual(linked.map((profile) => profile.id), ['student-new', 'member-new']);
  assert.ok(linked.every((profile) => profile.isNew));
});

test('rejects incompatible person records and missing records required by access roles', async () => {
  const { db, tx, getCollection } = firestoreMock();
  await assert.rejects(validateLinks(tx, db, 'account-1', ['volunteer'], ['coordinator-new'], [newProfile('coordinator-new', 'coordinator')], getCollection), /corresponder aos perfis/);
  await assert.rejects(validateLinks(tx, db, 'account-1', ['student'], [], [], getCollection), /Associe um perfil de pessoa correspondente/);
});

test('allows creating an access account before its person record is ready', async () => {
  const { db, tx, getCollection } = firestoreMock();
  const linked = await validateLinks(tx, db, 'account-1', ['student'], [], [], getCollection, { requireRequiredProfiles: false });
  assert.deepEqual(linked, []);
});

test('validates standalone person records without assigning an account', async () => {
  const { db, tx, getCollection } = firestoreMock();
  const student = newProfile('student-new', 'student');
  const linked = await validateLinks(tx, db, 'pending-person-records', ['student'], [student.id], [student], getCollection);
  assert.deepEqual(linked.map(profile => profile.id), [student.id]);
  assert.equal(linked[0].data.accountUid, undefined);
});

test('rejects person records linked elsewhere or students with invalid guardian references', async () => {
  const { db, tx, getCollection } = firestoreMock(
    [['member-1', { kind: 'member', active: true, accountUid: 'another-account' }], ['inactive-guardian', { kind: 'guardian', active: false }]],
  );
  await assert.rejects(validateLinks(tx, db, 'account-1', ['member'], ['member-1'], [], getCollection));
  const student = newProfile('student-new', 'student', { guardianIds: ['inactive-guardian'] });
  await assert.rejects(validateLinks(tx, db, 'account-1', ['student'], [student.id], [student], getCollection), /encarregado associado tem de ser/);
});
