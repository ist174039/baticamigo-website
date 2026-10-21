import { randomBytes } from "node:crypto";
import { context, collection, audit, json, failure } from "../../../../lib/platform/server";
import { assert, accountInput, hasRole, profileInput, profileIds } from "../../../../lib/platform/domain.mjs";

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

async function validateLinks(tx, db, uid, roles, ids, newProfile) {
  const profiles = [];
  for (const profileId of ids) {
    if (newProfile?.id === profileId) {
      profiles.push({ id: profileId, data: newProfile.data });
      continue;
    }
    const ref = collection(db, "profiles").doc(profileId);
    const snapshot = await tx.get(ref);
    assert(snapshot.exists && snapshot.data().active === true, "O perfil não existe ou está inativo.");
    assert(!snapshot.data().accountUid || snapshot.data().accountUid === uid, "O perfil já está associado a outra conta.", 409);
    const used = await tx.get(collection(db, "accounts").where("profileIds", "array-contains", profileId).limit(2));
    assert(used.docs.every((doc) => doc.id === uid), "O perfil já está associado a outra conta.", 409);
    profiles.push({ id: profileId, data: snapshot.data(), ref });
  }
  const represented = (role) => role === "volunteer"
    ? profiles.some((profile) => profile.data.kind === "tutor")
    : profiles.some((profile) => profile.data.kind === role);
  assert(profiles.every((profile) => roles.includes(profile.data.kind) || (profile.data.kind === "tutor" && roles.includes("volunteer"))), "Os papéis têm de corresponder aos perfis.");
  assert(roles.filter((role) => ["student", "guardian", "tutor", "volunteer", "member"].includes(role)).every(represented), "Associe um perfil correspondente a cada papel.");
  return profiles;
}

function publicUrl() {
  const host = process.env.NEXT_PUBLIC_APP_URL?.trim() || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.trim()}` : "https://baticamigo-website.vercel.app");
  const url = new URL("/area/login", host);
  assert(url.protocol === "https:" && !url.username && !url.password, "O endereço público tem de usar HTTPS.", 503);
  return url.toString();
}

function bootstrapAdmin(user) {
  const addresses = (process.env.FIREBASE_ADMIN_EMAILS || "carlos.gomes@baticamigo.pt").split(",").map((email) => email.trim().toLowerCase());
  return Boolean(user.emailVerified && addresses.includes(String(user.email || "").toLowerCase()));
}

function isAdmin(account, user) {
  return user?.customClaims?.admin === true || bootstrapAdmin(user) || (account?.active === true && (account.roles || [account.role]).includes("admin"));
}

export async function GET(request) {
  try {
    const { db, auth } = await adminContext(request);
    const [firebaseUsers, accountsSnapshot, profilesSnapshot] = await Promise.all([
      listAuthUsers(auth),
      collection(db, "accounts").limit(501).get(),
      collection(db, "profiles").limit(501).get(),
    ]);
    assert(accountsSnapshot.size <= 500 && profilesSnapshot.size <= 500, "Demasiados registos para listar. Contacte o suporte.", 409);
    const accounts = new Map(accountsSnapshot.docs.map((doc) => [doc.id, doc.data()]));
    const profiles = profilesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const linkedByUid = new Map();
    for (const profile of profiles) if (profile.accountUid) linkedByUid.set(profile.accountUid, [...(linkedByUid.get(profile.accountUid) || []), profile.id]);
    const users = firebaseUsers.map((user) => {
      const account = accounts.get(user.uid);
      const bootstrapAdmin = (process.env.FIREBASE_ADMIN_EMAILS || "carlos.gomes@baticamigo.pt").split(",").map((email) => email.trim().toLowerCase()).includes(String(user.email || "").toLowerCase()) && user.emailVerified;
      const legacyAdmin = user.customClaims?.admin === true || bootstrapAdmin;
      const linked = [...new Set([...(account ? profileIds(account) : []), ...(linkedByUid.get(user.uid) || [])])];
      const roles = account?.roles || (account?.role ? [account.role] : legacyAdmin ? ["admin"] : [...new Set(linked.map((id) => profileById.get(id)?.kind).filter(Boolean))]);
      return {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        disabled: user.disabled,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime || null,
        lastSignInAt: user.metadata.lastSignInTime || null,
        roles,
        profileIds: linked,
        profiles: linked.map((id) => profileById.get(id)).filter(Boolean).map(({ id, kind, name, memberNumber, membershipStatus }) => ({ id, kind, name, memberNumber, membershipStatus })),
        accessActive: account ? account.active === true : legacyAdmin,
        suspended: account?.suspended === true || user.disabled,
      };
    });
    return json({ users, profiles });
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
      const target = await auth.getUser(String(body.uid || "").trim());
      assert(target.email, "A conta não tem endereço de email.");
      const resetLink = await auth.generatePasswordResetLink(target.email, { url: publicUrl(), handleCodeInApp: false });
      await db.runTransaction(async (tx) => { const lock = collection(db, "locks").doc("platform-admins"); await tx.get(lock); tx.set(lock, { updatedAt: Date.now() }); audit(tx, db, account, body.delivery === "invite" ? "send-platform-user-invite" : "reset-platform-user-password", target.uid); });
      return json({ resetLink, emailDelivery: "manual" });
    }
    assert(Object.keys(body).every((key) => ["email", "displayName", "roles", "profileIds", "profile", "delivery"].includes(key)), "Campo não permitido.");
    assert(body.delivery === undefined || ["invite", "temporary"].includes(body.delivery), "Método de acesso inicial inválido.");
    const email = String(body.email || "").trim().toLowerCase();
    const displayName = String(body.displayName || "").trim();
    assert(/^\S+@\S+\.\S+$/.test(email) && email.length <= 254, "Introduza um email válido.");
    assert(displayName.length > 0 && displayName.length <= 100, "O nome deve ter entre 1 e 100 caracteres.");
    assert(Array.isArray(body.roles) && body.roles.length > 0, "Selecione pelo menos uma permissão.");

    const newProfileValue = body.profile ? profileInput(body.profile) : null;
    assert(!newProfileValue?.id, "Um novo perfil não pode ter identificador existente.");
    assert(!newProfileValue || newProfileValue.active, "Um perfil inativo não pode receber um novo acesso.");
    assert(body.profileIds === undefined || Array.isArray(body.profileIds), "Perfis inválidos.");
    const newProfileId = newProfileValue ? collection(db, "profiles").doc().id : null;
    const ids = [...(body.profileIds || []), ...(newProfileId ? [newProfileId] : [])];
    const userInput = accountInput({ uid: "pending-user", roles: body.roles, profileIds: ids, active: true });
    const temporaryPassword = body.delivery === "temporary" ? randomBytes(15).toString("base64url") : null;
    createdUser = await auth.createUser({ email, displayName, password: temporaryPassword || randomBytes(36).toString("base64url"), emailVerified: false, disabled: false });
    const resetLink = temporaryPassword ? null : await auth.generatePasswordResetLink(email, { url: publicUrl(), handleCodeInApp: false });
    const linked = await db.runTransaction(async (tx) => {
      const accountRef = collection(db, "accounts").doc(createdUser.uid);
      assert(!(await tx.get(accountRef)).exists, "A conta já tem permissões configuradas.", 409);
      const profileRef = newProfileId ? collection(db, "profiles").doc(newProfileId) : null;
      const profileData = newProfileValue ? { ...newProfileValue, accountUid: createdUser.uid, ...(newProfileValue.kind === "member" ? { membershipHistory: [{ status: newProfileValue.membershipStatus, at: new Date().toISOString(), actorUid: account.uid }] } : {}) } : null;
      const profiles = await validateLinks(tx, db, createdUser.uid, userInput.roles, ids, profileRef ? { id: newProfileId, data: profileData } : null);
      for (const profile of profiles) {
        if (profile.id === newProfileId) tx.create(profileRef, profileData);
        else tx.set(profile.ref, { ...profile.data, accountUid: createdUser.uid });
      }
      tx.create(accountRef, { ...userInput, uid: createdUser.uid, suspended: false });
      audit(tx, db, account, "create-platform-user", createdUser.uid);
      return profiles.map((profile) => profile.id);
    });
    return json({ user: { uid: createdUser.uid, email, displayName, profileIds: linked }, resetLink, temporaryPassword }, 201);
  } catch (error) {
    if (createdUser) {
      try { await auth.deleteUser(createdUser.uid); } catch { /* The API failure remains visible; account cleanup is best effort. */ }
    }
    return failure(error);
  }
}

export async function PATCH(request) {
  try {
    const { db, account, auth } = await adminContext(request);
    const body = await readJson(request);
    const uid = String(body.uid || "").trim();
    assert(uid && uid.length <= 128, "Selecione uma conta válida.");
    assert(uid !== account.uid, "Não pode alterar o seu próprio acesso.", 403);
    const target = await auth.getUser(uid);

    if (body.action === "update-access") {
      assert(Object.keys(body).every((key) => ["action", "uid", "roles", "profileIds", "active"].includes(key)), "Campo não permitido.");
      const value = accountInput({ uid, roles: body.roles, profileIds: body.profileIds, active: body.active });
      const bootstrap = bootstrapAdmin(target);
      assert(!target.customClaims?.admin || value.roles.includes("admin"), "Esta conta mantém privilégios administrativos Firebase; conserve a permissão de administrador.", 409);
      assert(!bootstrap || value.roles.includes("admin"), "Esta conta é administradora de configuração; conserve a permissão de administrador.", 409);
      await db.runTransaction(async (tx) => {
        const lockRef = collection(db, "locks").doc("platform-admins");
        await tx.get(lockRef);
        const accountRef = collection(db, "accounts").doc(uid);
        const previous = await tx.get(accountRef);
        const linked = await validateLinks(tx, db, uid, value.roles, value.profileIds);
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
        linked.forEach((profile) => tx.set(profile.ref, { ...profile.data, accountUid: uid }));
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
