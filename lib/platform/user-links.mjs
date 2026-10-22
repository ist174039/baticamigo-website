import { assert, profileKindMatchesRoles } from "./domain.mjs";

export async function validateLinks(tx, db, uid, roles, ids, newProfiles = [], getCollection, { requireRequiredProfiles = true } = {}) {
  const newProfilesById = new Map(newProfiles.map((profile) => [profile.id, profile]));
  const profiles = [];
  for (const profileId of ids) {
    if (newProfilesById.has(profileId)) {
      profiles.push({ id: profileId, data: newProfilesById.get(profileId).data, ref: newProfilesById.get(profileId).ref, isNew: true });
      continue;
    }
    const ref = getCollection(db, "profiles").doc(profileId);
    const snapshot = await tx.get(ref);
    assert(snapshot.exists && snapshot.data().active === true, "O perfil não existe ou está inativo.");
    assert(!snapshot.data().accountUid || snapshot.data().accountUid === uid, "O perfil já está associado a outra conta.", 409);
    const used = await tx.get(getCollection(db, "accounts").where("profileIds", "array-contains", profileId).limit(2));
    assert(used.docs.every((doc) => doc.id === uid), "O perfil já está associado a outra conta.", 409);
    profiles.push({ id: profileId, data: snapshot.data(), ref });
  }
  const guardianIds = [...new Set(profiles.flatMap((profile) => profile.data.kind === "student" ? (profile.data.guardianIds || []) : []))];
  const linkedProfilesById = new Map(profiles.map((profile) => [profile.id, profile.data]));
  const guardians = await Promise.all(guardianIds.map(async (guardianId) => {
    const draft = newProfilesById.get(guardianId);
    if (draft) return { id: guardianId, data: draft.data };
    if (linkedProfilesById.has(guardianId)) return { id: guardianId, data: linkedProfilesById.get(guardianId) };
    const snapshot = await tx.get(getCollection(db, "profiles").doc(guardianId));
    return { id: guardianId, data: snapshot.exists ? snapshot.data() : null };
  }));
  assert(guardians.every((guardian) => guardian.data?.kind === "guardian" && guardian.data.active === true), "Cada encarregado associado tem de ser um registo existente e ativo do tipo Encarregado.");
  assert(profiles.every((profile) => profileKindMatchesRoles(profile.data.kind, roles)), "Os perfis associados têm de corresponder aos perfis de acesso escolhidos.");
  // Volunteers and coordinators can be access profiles without a separate pupil/member/tutor record.
  if (requireRequiredProfiles) assert(roles.filter((role) => ["student", "guardian", "tutor", "member"].includes(role)).every((role) => profiles.some((profile) => profile.data.kind === role)), "Associe um perfil de pessoa correspondente a cada perfil de acesso.");
  return profiles;
}
