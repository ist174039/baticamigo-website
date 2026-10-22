import { randomBytes } from "node:crypto";
import { context, collection, audit, json, failure } from "../../../../lib/platform/server";
import { PlatformError, assert, accountInput, hasRole, id, profileInput, profileIds, profileDependencyReasons, profileKindMatchesRoles } from "../../../../lib/platform/domain.mjs";
import {areaModules,defaultAccessProfiles,effectiveAccountAreas,isBootstrapAdmin,validateAccessProfiles} from "../../../../lib/platform/access.mjs";
import {canAccessArea} from "../../../../lib/platform/access.mjs";
import { validateLinks as validateUserLinks } from "../../../../lib/platform/user-links.mjs";
import { platformContinueUrl } from "../../../../lib/platform/continue-url.mjs";
import { userCreationError } from "../../../../lib/platform/user-creation-error.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readJson(request) {
  const size = Number(request.headers.get("content-length") || 0);
  assert(size <= 16384, "Pedido demasiado grande.", 413);
  const reader = request.body?.getReader();
  assert(reader, "Pedido vazio.");
  const chunks = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 16384) { await reader.cancel(); assert(false, "Pedido demasiado grande.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { assert(false, "JSON inválido."); }
  assert(body && typeof body === "object" && !Array.isArray(body), "Pedido inválido.");
  return body;
}

async function adminContext(request) {
  const value = await context(request);
  assert(hasRole(value.account, "admin"), "Apenas administradores podem gerir utilizadores.", 403);
  assert(canAccessArea(value.account, "profiles"), "O menu de gestão de pessoas não está disponível para esta conta.", 403);
  return value;
}

async function listAuthUsers(auth) {
  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    assert(users.length <= 5000, "Demasiados utilizadores para listar. Contacte o suporte.", 409);
    pageToken = page.pageToken;
  } while (pageToken);
  return users;
}

export const validateLinks = (tx, db, uid, roles, ids, newProfiles = []) => validateUserLinks(tx, db, uid, roles, ids, newProfiles, collection);

function bootstrapAdmin(user) {
  return isBootstrapAdmin(user?.email,user?.emailVerified);
}

function isAdmin(account, user) {
  if (bootstrapAdmin(user)) return true;
  if (account) return account.active === true && account.suspended !== true && (account.roles || [account.role]).includes("admin");
  return user?.customClaims?.admin === true;
}

async function requirePlatformAccount(db, uid) {
  assert(uid && uid.length <= 128, "Selecione uma conta válida.");
  const snapshot = await collection(db, "accounts").doc(uid).get();
  assert(snapshot.exists, "Este utilizador ainda não tem acesso configurado à plataforma.", 404);
  return snapshot.data();
}

async function profileReferences(db, profileId, profile, tx) {
  const queries = [
    collection(db, "accounts").where("profileIds", "array-contains", profileId).limit(1),
    collection(db, "profiles").where("guardianIds", "array-contains", profileId).limit(1),
    collection(db, "sessions").where("tutorId", "==", profileId).limit(1),
    collection(db, "sessions").where("studentIds", "array-contains", profileId).limit(1),
    collection(db, "records").where("studentId", "==", profileId).limit(1),
    collection(db, "attendance").where("studentId", "==", profileId).limit(1),
    collection(db, "dues").where("memberId", "==", profileId).limit(1),
  ];
  const [accounts, dependents, tutorSessions, studentSessions, records, attendance, dues] = await Promise.all(queries.map(query => tx ? tx.get(query) : query.get()));
  return profileDependencyReasons({
    account: Boolean(profile.accountUid) || !accounts.empty,
    dependents: !dependents.empty,
    sessions: !tutorSessions.empty || !studentSessions.empty,
    records: !records.empty,
    attendance: !attendance.empty,
    dues: !dues.empty,
  });
}

export async function GET(request) {
  try {
    const { db, auth } = await adminContext(request);
    const requestedProfileId = new URL(request.url).searchParams.get("profileId");
    if (requestedProfileId) {
      const profileId = id(requestedProfileId);
      const profile = await collection(db, "profiles").doc(profileId).get();
      assert(profile.exists, "Registo não encontrado.", 404);
      return json({ profileId, dependencyReasons: await profileReferences(db, profileId, profile.data()) });
    }
    const [firebaseUsers, accountsSnapshot, profilesSnapshot, accessSettingsSnapshot] = await Promise.all([
      listAuthUsers(auth),
      collection(db, "accounts").limit(501).get(),
      collection(db, "profiles").limit(501).get(),
      collection(db, "access_settings").doc("profiles").get(),
    ]);
    assert(accountsSnapshot.size <= 500 && profilesSnapshot.size <= 500, "Demasiados registos para listar. Contacte o suporte.", 409);
    const accounts = new Map(accountsSnapshot.docs.map((doc) => [doc.id, doc.data()]));
    const profiles = profilesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const accessProfiles=accessSettingsSnapshot.exists?validateAccessProfiles(accessSettingsSnapshot.data().profiles):defaultAccessProfiles;
    assert(accessProfiles,"Configuração de perfis inválida.",503);
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const linkedByUid = new Map();
    for (const profile of profiles) if (profile.accountUid) linkedByUid.set(profile.accountUid, [...(linkedByUid.get(profile.accountUid) || []), profile.id]);
    const users = firebaseUsers.map((user) => {
      const account = accounts.get(user.uid);
      const bootstrap = isBootstrapAdmin(user.email,user.emailVerified);
      const legacyAdmin = user.customClaims?.admin === true || bootstrap;
      const linked = [...new Set([...(account ? profileIds(account) : []), ...(linkedByUid.get(user.uid) || [])])];
      const roles = account?.roles || (account?.role ? [account.role] : legacyAdmin ? ["admin"] : [...new Set(linked.map((id) => profileById.get(id)?.kind).filter(Boolean))]);
      const resolvedAccess=effectiveAccountAreas(roles,account?.modules,accessProfiles,accessSettingsSnapshot.exists);
      return {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        disabled: user.disabled,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime || null,
        lastSignInAt: user.metadata.lastSignInTime || null,
        roles,
        modules:resolvedAccess.modules,
        accessConfigurationInvalid:resolvedAccess.invalidLegacy,
        profileIds: linked,
        profiles: linked.map((id) => profileById.get(id)).filter(Boolean).map(({ id, kind, name, memberNumber, membershipStatus }) => ({ id, kind, name, memberNumber, membershipStatus })),
        accessActive: account ? account.active === true : legacyAdmin,
        suspended: account?.suspended === true || user.disabled,
      };
    });
    return json({ users, profiles, accessProfiles, areaModules });
  } catch (error) { return failure(error); }
}

export async function POST(request) {
  let createdUser;
  let auth;
  try {
    const contextValue = await adminContext(request);
    const { db, account } = contextValue;
    auth = contextValue.auth;
    const body = await readJson(request);
    if (body.action === "reset-password") {
      assert(Object.keys(body).every((key) => ["action", "uid", "delivery"].includes(key)), "Campo não permitido.");
      const uid = String(body.uid || "").trim();
      await requirePlatformAccount(db, uid);
      const target = await auth.getUser(uid);
      assert(target.email, "A conta não tem endereço de email.");
      const resetLink = await auth.generatePasswordResetLink(target.email, { url: platformContinueUrl(), handleCodeInApp: false });
      await db.runTransaction(async (tx) => { const lock = collection(db, "locks").doc("platform-admins"); await tx.get(lock); tx.set(lock, { updatedAt: Date.now() }); audit(tx, db, account, body.delivery === "invite" ? "send-platform-user-invite" : "reset-platform-user-password", target.uid); });
      return json({ resetLink, emailDelivery: "manual" });
    }
    if (body.action === "generate-temporary-password") {
      assert(Object.keys(body).every((key) => ["action", "uid"].includes(key)), "Campo não permitido.");
      const uid = String(body.uid || "").trim();
      assert(uid && uid !== account.uid, "Não pode substituir a sua própria palavra-passe por esta ação.", 403);
      await requirePlatformAccount(db, uid);
      const target = await auth.getUser(uid);
      const temporaryPassword = randomBytes(15).toString("base64url");
      await db.runTransaction(async (tx) => { const lock = collection(db, "locks").doc("platform-admins"); await tx.get(lock); tx.set(lock, { updatedAt: Date.now() }); audit(tx, db, account, "generate-platform-user-temporary-password", uid); });
      await auth.updateUser(uid, { password: temporaryPassword });
      let sessionsRevoked = false;
      for (let attempt = 0; attempt < 2 && !sessionsRevoked; attempt += 1) {
        try { await auth.revokeRefreshTokens(uid); sessionsRevoked = true; }
        catch { if (attempt === 1) console.error("Não foi possível terminar todas as sessões do utilizador após substituir a palavra-passe."); }
      }
      return json({ email: target.email || "", temporaryPassword, sessionsRevoked });
    }
    if (body.action === "create-person-records") {
      assert(Object.keys(body).every(key => ["action", "profilesToCreate"].includes(key)), "Campo não permitido.");
      assert(Array.isArray(body.profilesToCreate) && body.profilesToCreate.length > 0 && body.profilesToCreate.length <= 10, "Escolha pelo menos um registo de pessoa (máximo de 10).");
      const kinds = [...new Set(body.profilesToCreate.map(value => profileInput(value).kind))];
      const createProfiles = body.profilesToCreate.map(value => {
        const data = profileInput(value);
        assert(!data.id && data.active, "Um novo registo tem de estar ativo e não pode ter identificador existente.");
        const ref = collection(db, "profiles").doc();
        const profileData = { ...data, accountUid: "", ...(data.kind === "member" ? { membershipHistory: [{ status: data.membershipStatus, at: new Date().toISOString(), actorUid: account.uid }] } : {}) };
        return { id: ref.id, ref, data: profileData };
      });
      const profileIdsToCreate = createProfiles.map(profile => profile.id);
      const createdProfiles = await db.runTransaction(async tx => {
        const profiles = await validateLinks(tx, db, "pending-person-records", kinds, profileIdsToCreate, createProfiles, collection);
        for (const profile of profiles) tx.create(profile.ref, profile.data);
        audit(tx, db, account, "create-platform-person-records", profileIdsToCreate.join(","), { count: profiles.length, kinds });
        return profiles.map(profile => ({ id: profile.id, kind: profile.data.kind, name: profile.data.name }));
      });
      return json({ profiles: createdProfiles }, 201);
    }
    assert(Object.keys(body).every((key) => ["email", "displayName", "roles", "profileIds", "profile", "profilesToCreate", "delivery", "creationMode"].includes(key)), "Campo não permitido.");
    const creationMode = body.creationMode || "both";
    assert(["account", "both"].includes(creationMode), "Escolha criar uma conta ou uma conta com registos de pessoa.");
    assert(creationMode !== "account" || (!(body.profilesToCreate || []).length && !(body.profileIds || []).length && !body.profile), "Para criar apenas a conta, remova os registos de pessoa associados.");
    assert(body.delivery === undefined || ["invite", "temporary"].includes(body.delivery), "Método de acesso inicial inválido.");
    const email = String(body.email || "").trim().toLowerCase();
    const displayName = String(body.displayName || "").trim();
    assert(/^\S+@\S+\.\S+$/.test(email) && email.length <= 254, "Introduza um email válido.");
    assert(displayName.length > 0 && displayName.length <= 100, "O nome deve ter entre 1 e 100 caracteres.");
    assert(Array.isArray(body.roles) && body.roles.length > 0, "Selecione pelo menos uma permissão.");

    assert(body.profileIds === undefined || Array.isArray(body.profileIds), "Perfis inválidos.");
    assert(body.profilesToCreate === undefined || Array.isArray(body.profilesToCreate), "Registos de pessoa inválidos.");
    const profileInputs = [...(body.profilesToCreate || []), ...(body.profile ? [body.profile] : [])];
    assert(profileInputs.length <= 10, "Pode criar até 10 registos de pessoa de cada vez.");
    const userInput = accountInput({ uid: "pending-user", roles: body.roles, profileIds: body.profileIds || [], active: true });
    // Profile IDs are generated before the transaction so the account and records can be linked atomically.
    const createProfiles = profileInputs.map((value) => {
      const data = profileInput(value);
      assert(!data.id, "Um novo perfil não pode ter identificador existente.");
      assert(data.active, "Um perfil inativo não pode receber um novo acesso.");
      assert(profileKindMatchesRoles(data.kind, userInput.roles), `O perfil ${data.kind} não corresponde às permissões de acesso escolhidas.`);
      const ref = collection(db, "profiles").doc();
      const profileData = { ...data, accountUid: "", ...(data.kind === "member" ? { membershipHistory: [{ status: data.membershipStatus, at: new Date().toISOString(), actorUid: account.uid }] } : {}) };
      return { id: ref.id, ref, data: profileData };
    });
    const ids = [...(body.profileIds || []), ...createProfiles.map((profile) => profile.id)];
    const validatedUserInput = accountInput({ uid: "pending-user", roles: body.roles, profileIds: ids, active: true });
    const temporaryPassword = body.delivery === "temporary" ? randomBytes(15).toString("base64url") : null;
    createdUser = await auth.createUser({ email, displayName, password: temporaryPassword || randomBytes(36).toString("base64url"), emailVerified: false, disabled: false });
    const resetLink = temporaryPassword ? null : await auth.generatePasswordResetLink(email, { url: platformContinueUrl(), handleCodeInApp: false });
    const linked = await db.runTransaction(async (tx) => {
      const accountRef = collection(db, "accounts").doc(createdUser.uid);
      assert(!(await tx.get(accountRef)).exists, "A conta já tem permissões configuradas.", 409);
      const profilesToStore = createProfiles.map((profile) => ({ ...profile, data: { ...profile.data, accountUid: createdUser.uid } }));
      const profiles = await validateLinks(tx, db, createdUser.uid, validatedUserInput.roles, ids, profilesToStore, collection, { requireRequiredProfiles: creationMode !== "account" });
      for (const profile of profiles) {
        if (profile.isNew) tx.create(profile.ref, profile.data);
        else tx.set(profile.ref, { ...profile.data, name: displayName, email, accountUid: createdUser.uid });
      }
      tx.create(accountRef, { ...validatedUserInput, uid: createdUser.uid, suspended: false });
      audit(tx, db, account, "create-platform-user", createdUser.uid);
      return profiles.map((profile) => profile.id);
    });
    return json({ user: { uid: createdUser.uid, email, displayName, profileIds: linked }, resetLink, temporaryPassword }, 201);
  } catch (error) {
    if (createdUser) {
      try { await auth.deleteUser(createdUser.uid); } catch { /* The API failure remains visible; account cleanup is best effort. */ }
    }
    const creationError = userCreationError(error);
    if (creationError) return failure(new PlatformError(creationError.status, creationError.message));
    return failure(error);
  }
}

export async function PATCH(request) {
  try {
    const { db, account, auth } = await adminContext(request);
    const body = await readJson(request);
    if (body.action === "delete-profile") {
      assert(Object.keys(body).every(key => ["action", "profileId"].includes(key)), "Campo não permitido.");
      const profileId = id(body.profileId);
      const profileRef = collection(db, "profiles").doc(profileId);
      await db.runTransaction(async tx => {
        const profile = await tx.get(profileRef);
        assert(profile.exists, "Registo não encontrado.", 404);
        const dependencyReasons = await profileReferences(db, profileId, profile.data(), tx);
        assert(dependencyReasons.length === 0, `Este registo tem dados associados (${dependencyReasons.join(", ")}); só pode ser suspenso.`, 409);
        tx.delete(profileRef);
        audit(tx, db, account, "delete-platform-profile", profileId, { profileKind: profile.data().kind });
      });
      return json({ deleted: true });
    }
    if(body.action==="update-access-profiles") {
      assert(Object.keys(body).every(key=>["action","accessProfiles"].includes(key)),"Campo não permitido.");
      const accessProfiles=validateAccessProfiles(body.accessProfiles);
      assert(accessProfiles,"Configure menus válidos para cada perfil. O Administrador mantém acesso completo.");
      await db.runTransaction(async tx=>{
        const lock=collection(db,"locks").doc("platform-admins"); await tx.get(lock);
        tx.set(collection(db,"access_settings").doc("profiles"),{profiles:accessProfiles,updatedAt:Date.now(),updatedBy:account.uid});
        tx.set(lock,{updatedAt:Date.now()});
        audit(tx,db,account,"update-platform-access-profiles","profiles");
      });
      return json({saved:true,accessProfiles});
    }
    const uid = String(body.uid || "").trim();
    assert(uid && uid.length <= 128, "Selecione uma conta válida.");
    assert(uid !== account.uid, "Não pode alterar o seu próprio acesso.", 403);
    const target = await auth.getUser(uid);

    if (body.action === "update-access") {
      assert(Object.keys(body).every((key) => ["action", "uid", "roles", "profileIds", "profilesToCreate", "active"].includes(key)), "Campo não permitido.");
      assert(body.profileIds === undefined || Array.isArray(body.profileIds), "Perfis inválidos.");
      assert(body.profilesToCreate === undefined || (Array.isArray(body.profilesToCreate) && body.profilesToCreate.length <= 10), "Registos de pessoa inválidos.");
      const inputs = (body.profilesToCreate || []).map(profileInput);
      const newProfileRefs = inputs.map((data) => {
        assert(!data.id, "Um novo perfil não pode ter identificador existente.");
        assert(data.active, "Um perfil inativo não pode receber um novo acesso.");
        assert(profileKindMatchesRoles(data.kind, body.roles || []), `O perfil ${data.kind} não corresponde às permissões de acesso escolhidas.`);
        const ref = collection(db, "profiles").doc();
        return {
          id: ref.id,
          ref,
          data: {
            ...data,
            accountUid: uid,
            ...(data.kind === "member" ? { membershipHistory: [{ status: data.membershipStatus, at: new Date().toISOString(), actorUid: account.uid }] } : {}),
          },
        };
      });
      const requestedIds = [...(body.profileIds || []), ...newProfileRefs.map((profile) => profile.id)];
      const value = accountInput({ uid, roles: body.roles, profileIds: requestedIds, active: body.active });
      const bootstrap = bootstrapAdmin(target);
      assert(!bootstrap || value.roles.includes("admin"), "Esta conta é administradora de configuração; conserve a permissão de administrador.", 409);
      await db.runTransaction(async (tx) => {
        const lockRef = collection(db, "locks").doc("platform-admins");
        await tx.get(lockRef);
        const accountRef = collection(db, "accounts").doc(uid);
        const previous = await tx.get(accountRef);
        const linked = await validateLinks(tx, db, uid, value.roles, value.profileIds, newProfileRefs);
        const previousIds = previous.exists ? profileIds(previous.data()) : [];
        const removed = previousIds.filter((profileId) => !value.profileIds.includes(profileId));
        const removedRefs = removed.map((profileId) => collection(db, "profiles").doc(profileId));
        const removedProfiles = removedRefs.length ? await tx.getAll(...removedRefs) : [];
        if ((isAdmin(previous.data(), target)) && (!value.active || !value.roles.includes("admin"))) {
          const [accounts, users] = await Promise.all([tx.get(collection(db, "accounts").where("active", "==", true)), listAuthUsers(auth)]);
          const userById = new Map(users.map((user) => [user.uid, user]));
          const remaining = accounts.docs.some((doc) => doc.id !== uid && isAdmin(doc.data(), userById.get(doc.id)) && !userById.get(doc.id)?.disabled)
            || users.some((user) => user.uid !== uid && !user.disabled && isAdmin(null, user));
          assert(remaining, "Não pode remover ou desativar a última conta administradora ativa.", 409);
        }
        removedProfiles.forEach((profile, index) => { if (profile.exists && profile.data().accountUid === uid) tx.set(removedRefs[index], { ...profile.data(), accountUid: "" }); });
        linked.forEach((profile) => {
          if (profile.isNew) tx.create(profile.ref, profile.data);
          else tx.set(profile.ref, { ...profile.data, name: target.displayName || profile.data.name, email: target.email || profile.data.email || "", accountUid: uid });
        });
        tx.set(accountRef, { ...value, suspended: previous.data()?.suspended === true });
        tx.set(lockRef, { updatedAt: Date.now() });
        audit(tx, db, account, "update-platform-user-access", uid);
      });
      return json({ saved: true });
    }

    assert(["suspend", "restore"].includes(body.action) && Object.keys(body).every((key) => ["action", "uid"].includes(key)), "Operação inválida.");
    const disabled = body.action === "suspend";
    await auth.updateUser(uid, { disabled });
    try {
      if (disabled) await auth.revokeRefreshTokens(uid);
      await db.runTransaction(async (tx) => {
        const lockRef = collection(db, "locks").doc("platform-admins");
        await tx.get(lockRef);
        const ref = collection(db, "accounts").doc(uid);
        const previous = await tx.get(ref);
        if (disabled && isAdmin(previous.data(), target) && !target.disabled) {
          const [accounts, users] = await Promise.all([tx.get(collection(db, "accounts").where("active", "==", true)), listAuthUsers(auth)]);
          const userById = new Map(users.map((user) => [user.uid, user]));
          const remaining = accounts.docs.some((doc) => doc.id !== uid && isAdmin(doc.data(), userById.get(doc.id)) && !userById.get(doc.id)?.disabled)
            || users.some((user) => user.uid !== uid && !user.disabled && isAdmin(null, user));
          assert(remaining, "Não pode suspender o último administrador ativo.", 409);
        }
        if (previous.exists) tx.set(ref, { ...previous.data(), suspended: disabled });
        tx.set(lockRef, { updatedAt: Date.now() });
        audit(tx, db, account, disabled ? "suspend-platform-user" : "restore-platform-user", uid);
      });
    } catch (error) {
      try { await auth.updateUser(uid, { disabled: target.disabled }); } catch { /* Fail closed if compensation is unavailable. */ }
      throw error;
    }
    return json({ suspended: disabled });
  } catch (error) { return failure(error); }
}

export async function DELETE(request) {
  try {
    const { db, account, auth } = await adminContext(request);
    const body = await readJson(request);
    assert(Object.keys(body).every((key) => key === "uid"), "Campo não permitido.");
    const uid = String(body.uid || "").trim();
    assert(uid && uid.length <= 128, "Selecione uma conta válida.");
    assert(uid !== account.uid, "Não pode remover a sua própria conta.", 403);
    const target = await auth.getUser(uid);
    assert(!isBootstrapAdmin(target.email, true), "A conta administradora principal não pode ser removida.", 403);
    const targetRef = collection(db, "accounts").doc(uid);
    const linkedQuery = await collection(db, "profiles").where("accountUid", "==", uid).get();
    await auth.updateUser(uid, { disabled: true });
    try {
      await auth.revokeRefreshTokens(uid);
      await db.runTransaction(async (tx) => {
        const lockRef = collection(db, "locks").doc("platform-admins");
        await tx.get(lockRef);
        const current = await tx.get(targetRef);
        const ids = [...new Set([...(current.exists ? profileIds(current.data()) : []), ...linkedQuery.docs.map((doc) => doc.id)])];
        const profileRefs = ids.map((id) => collection(db, "profiles").doc(id));
        const profiles = profileRefs.length ? await tx.getAll(...profileRefs) : [];
        if ((isAdmin(current.data(), target))) {
          const [accounts, users] = await Promise.all([tx.get(collection(db, "accounts").where("active", "==", true)), listAuthUsers(auth)]);
          const byId = new Map(users.filter((user) => user.uid !== uid).map((user) => [user.uid, user]));
          const remaining = accounts.docs.some((doc) => doc.id !== uid && isAdmin(doc.data(), byId.get(doc.id)) && !byId.get(doc.id)?.disabled)
            || users.some((user) => user.uid !== uid && !user.disabled && isAdmin(null, user));
          assert(remaining, "Não pode remover a última conta administradora ativa.", 409);
        }
        profiles.forEach((profile, index) => { if (profile.exists && profile.data().accountUid === uid) tx.update(profileRefs[index], { accountUid: "" }); });
        if (current.exists) tx.delete(targetRef);
        tx.set(lockRef, { updatedAt: Date.now() });
        audit(tx, db, account, "delete-platform-user", uid, { profileIds: ids });
      });
    } catch (error) {
      try { await auth.updateUser(uid, { disabled: target.disabled }); } catch { /* Leave account disabled if compensation fails. */ }
      throw error;
    }
    try {
      await auth.deleteUser(uid);
      return json({ deleted: true, profilesPreserved: true });
    } catch {
      return json({ deleted: true, profilesPreserved: true, authCleanupPending: true });
    }
  } catch (error) { return failure(error); }
}
