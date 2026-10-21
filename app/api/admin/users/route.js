import { randomBytes } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import {bootstrapAdminEmails,isActivePlatformAdmin} from "../../../../lib/platform/access.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectId = "baticamigo-c0384";
const bootstrapAdmins = () => bootstrapAdminEmails();

class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function firebaseAuth() {
  const serializedAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serializedAccount) throw new ApiError(503, "A gestão de utilizadores ainda não está configurada no servidor.", "admin/configuration-missing");

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serializedAccount);
  } catch {
    throw new ApiError(503, "A credencial Firebase do servidor não tem um formato válido.", "admin/invalid-credentials");
  }
  if (serviceAccount.project_id !== projectId) {
    throw new ApiError(503, "A credencial Firebase configurada pertence a outro projeto.", "admin/wrong-project");
  }

  const app = getApps().find((candidate) => candidate.name === "baticamigo-admin")
    || initializeApp({ credential: cert(serviceAccount), projectId }, "baticamigo-admin");
  return getAuth(app);
}

function isAdmin(user) {
  return user.admin === true || ((user.email_verified === true || user.emailVerified === true) && bootstrapAdmins().has(String(user.email || "").toLowerCase()));
}

async function readJson(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16384) throw new ApiError(413, "Pedido demasiado grande.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Pedido vazio.");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw new ApiError(413, "Pedido demasiado grande.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError(400, "JSON inválido.");
  }
}

async function requireAdmin(request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new ApiError(401, "Inicie sessão para continuar.");
  const auth = firebaseAuth();
  let decoded;
  try {
    decoded = await auth.verifyIdToken(token, true);
  } catch {
    throw new ApiError(401, "A sessão expirou. Inicie sessão novamente.");
  }
  if (bootstrapAdmins().has(String(decoded.email || "").toLowerCase()) && decoded.email_verified !== true) {
    throw new ApiError(403, "Confirme o email da conta antes de gerir utilizadores.");
  }
  const platformAccountSnapshot=await getFirestore(auth.app).collection("platform_accounts").doc(decoded.uid).get();
  const platformAccount=platformAccountSnapshot.exists?platformAccountSnapshot.data():null;
  const platformAdmin=isActivePlatformAdmin(platformAccount);
  if (!isAdmin(decoded)&&!platformAdmin) throw new ApiError(403, "A sua conta não tem acesso à gestão de utilizadores.");
  let refreshToken = false;
  if (platformAdmin||bootstrapAdmins().has(String(decoded.email || "").toLowerCase())) {
    const account = await auth.getUser(decoded.uid);
    if (account.customClaims?.admin !== true) {
      await auth.setCustomUserClaims(decoded.uid, { ...account.customClaims, admin: true, role: "admin" });
    }
    // A parallel management request can set the claim before this request,
    // while this request still carries the user's older, claimless ID token.
    refreshToken = decoded.admin !== true;
  }
  return { auth, decoded, refreshToken };
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function handleError(error) {
  if (error instanceof ApiError) return json({ error: error.message, code: error.code || "admin/request-rejected" }, error.status);
  const code = error?.code;
  if (code === "auth/email-already-exists") return json({ error: "Já existe uma conta com esse email." }, 409);
  if (code === "auth/user-not-found") return json({ error: "A conta já não existe." }, 404);
  if (code === "auth/invalid-email" || code === "auth/invalid-password") return json({ error: "Os dados da conta são inválidos." }, 400);
  console.error("Erro na gestão de utilizadores Firebase:", code || error?.message || "unknown", error?.stack);
  return json({ error: "Não foi possível concluir a operação. Tente novamente.", code: String(code || "admin/server-error") }, 500);
}

function serializeUser(user) {
  return {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    disabled: user.disabled,
    emailVerified: user.emailVerified,
    role: isAdmin({ email: user.email, admin: user.customClaims?.admin }) ? "Administrador" : "Sem acesso de administração",
    createdAt: user.metadata.creationTime || null,
    lastSignInAt: user.metadata.lastSignInTime || null,
  };
}

function passwordResetContinueUrl() {
  const vercelHost = process.env.VERCEL_URL?.trim();
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
    || (vercelHost ? `https://${vercelHost}` : "https://baticamigo-website.vercel.app");
  let url;
  try {
    url = new URL("/admin/login", configured);
  } catch {
    throw new ApiError(503, "O endereço público da aplicação não está configurado corretamente.", "admin/invalid-public-url");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new ApiError(503, "O endereço público da aplicação tem de usar HTTPS.", "admin/invalid-public-url");
  }
  return url.toString();
}

async function clearPlatformAccess(auth, uid) {
  const db = getFirestore(auth.app);
  const accountRef = db.collection("accounts").doc(uid);
  await db.runTransaction(async (transaction) => {
    const accountSnapshot = await transaction.get(accountRef);
    const accountProfileIds = accountSnapshot.exists && Array.isArray(accountSnapshot.data().profileIds)
      ? accountSnapshot.data().profileIds
      : [];
    const linkedQuery = db.collection("profiles").where("accountUid", "==", uid);
    const linkedSnapshot = await transaction.get(linkedQuery);
    const profileRefs = new Map(accountProfileIds.map((profileId) => [profileId, db.collection("profiles").doc(profileId)]));
    for (const profile of linkedSnapshot.docs) profileRefs.set(profile.id, profile.ref);
    const profileSnapshots = [];
    for (const profileRef of profileRefs.values()) profileSnapshots.push(await transaction.get(profileRef));
    for (const profile of profileSnapshots) {
      if (profile.exists && profile.data().accountUid === uid) transaction.update(profile.ref, { accountUid: "" });
    }
    if (accountSnapshot.exists) transaction.delete(accountRef);
  });
}

async function listAllUsers(auth) {
  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return users;
}

export async function GET(request) {
  try {
    const { auth, refreshToken } = await requireAdmin(request);
    const url = new URL(request.url);
    if (url.searchParams.get("check") === "1") return json({ authorized: true, refreshToken });
    const collectionName = url.searchParams.get("collection");
    if (collectionName === "membros" || collectionName === "parceiros") {
      console.info("Leitura da coleção administrativa solicitada:", collectionName, auth.app.options.projectId);
      const snapshot = await getFirestore(auth.app).collection(collectionName).get();
      console.info("Leitura da coleção administrativa concluída:", collectionName, snapshot.size);
      return json({ documents: snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })) });
    }
    const users = await listAllUsers(auth);
    return json({ users: users.filter((user) => isAdmin({ email: user.email, admin: user.customClaims?.admin })).map(serializeUser) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request) {
  let createdUser;
  try {
    const { auth } = await requireAdmin(request);
    const body = await readJson(request);

    if (body.action === "reset-password") {
      const uid = String(body.uid || "").trim();
      if (!uid) throw new ApiError(400, "Selecione uma conta válida.");
      const target = await auth.getUser(uid);
      const link = await auth.generatePasswordResetLink(target.email, {
        url: passwordResetContinueUrl(),
        handleCodeInApp: false,
      });
      return json({ resetLink: link });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const displayName = String(body.displayName || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) throw new ApiError(400, "Introduza um email válido.");
    if (!displayName || displayName.length > 100) throw new ApiError(400, "O nome deve ter entre 1 e 100 caracteres.");

    createdUser = await auth.createUser({
      email,
      displayName,
      password: randomBytes(36).toString("base64url"),
      emailVerified: false,
      disabled: false,
    });
    await auth.setCustomUserClaims(createdUser.uid, { admin: true, role: "admin" });
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: passwordResetContinueUrl(),
      handleCodeInApp: false,
    });
    return json({ user: serializeUser(await auth.getUser(createdUser.uid)), resetLink }, 201);
  } catch (error) {
    if (createdUser) {
      try {
        await firebaseAuth().deleteUser(createdUser.uid);
      } catch (cleanupError) {
        console.error("Não foi possível reverter a criação incompleta da conta:", cleanupError?.code || "unknown");
      }
    }
    return handleError(error);
  }
}

export async function PATCH(request) {
  try {
    const { auth, decoded } = await requireAdmin(request);
    const body = await readJson(request);
    const uid = String(body.uid || "").trim();
    if (!uid || typeof body.disabled !== "boolean") throw new ApiError(400, "Dados de atualização inválidos.");
    if (uid === decoded.uid) throw new ApiError(400, "Não pode desativar a sua própria conta.");

    const target = await auth.getUser(uid);
    if (body.disabled && isAdmin({ email: target.email, admin: target.customClaims?.admin })) {
      const activeAdmins = (await listAllUsers(auth)).filter((user) => !user.disabled && isAdmin({ email: user.email, admin: user.customClaims?.admin }));
      if (activeAdmins.length <= 1) throw new ApiError(400, "Não pode desativar o último administrador ativo.");
    }
    const updatedUser = await auth.updateUser(uid, { disabled: body.disabled });
    if (body.disabled) await auth.revokeRefreshTokens(uid);
    return json({ user: serializeUser(updatedUser) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request) {
  try {
    const { auth, decoded } = await requireAdmin(request);
    const { uid } = await readJson(request);
    const targetUid = String(uid || "").trim();
    if (!targetUid) throw new ApiError(400, "Selecione uma conta válida.");
    if (targetUid === decoded.uid) throw new ApiError(400, "Não pode remover a sua própria conta.");

    const target = await auth.getUser(targetUid);
    if (isAdmin({ email: target.email, admin: target.customClaims?.admin })) {
      const activeAdmins = (await listAllUsers(auth)).filter((user) => !user.disabled && isAdmin({ email: user.email, admin: user.customClaims?.admin }));
      if (activeAdmins.length <= 1) throw new ApiError(400, "Não pode remover a última conta administrativa ativa.");
    }
    await clearPlatformAccess(auth, targetUid);
    await auth.deleteUser(targetUid);
    return json({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
