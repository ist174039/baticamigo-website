import { randomBytes } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectId = "baticamigo-c0384";
const bootstrapAdmins = () => new Set(
  (process.env.FIREBASE_ADMIN_EMAILS || "carlos.gomes@baticamigo.pt")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function firebaseAuth() {
  const serializedAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serializedAccount) throw new ApiError(503, "A gestão de utilizadores ainda não está configurada no servidor.");

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serializedAccount);
  } catch {
    throw new ApiError(503, "A credencial Firebase do servidor não tem um formato válido.");
  }
  if (serviceAccount.project_id !== projectId) {
    throw new ApiError(503, "A credencial Firebase configurada pertence a outro projeto.");
  }

  const app = getApps().find((candidate) => candidate.name === "baticamigo-admin")
    || initializeApp({ credential: cert(serviceAccount), projectId }, "baticamigo-admin");
  return getAuth(app);
}

function isAdmin(user) {
  return user.admin === true || bootstrapAdmins().has(String(user.email || "").toLowerCase());
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
  if (!isAdmin(decoded)) throw new ApiError(403, "A sua conta não tem acesso à gestão de utilizadores.");
  let refreshToken = false;
  if (bootstrapAdmins().has(String(decoded.email || "").toLowerCase())) {
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
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  const code = error?.code;
  if (code === "auth/email-already-exists") return json({ error: "Já existe uma conta com esse email." }, 409);
  if (code === "auth/user-not-found") return json({ error: "A conta já não existe." }, 404);
  if (code === "auth/invalid-email" || code === "auth/invalid-password") return json({ error: "Os dados da conta são inválidos." }, 400);
  console.error("Erro na gestão de utilizadores Firebase:", code || error?.message || "unknown");
  return json({ error: "Não foi possível concluir a operação. Tente novamente." }, 500);
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
    const body = await request.json();

    if (body.action === "reset-password") {
      const uid = String(body.uid || "").trim();
      if (!uid) throw new ApiError(400, "Selecione uma conta válida.");
      const target = await auth.getUser(uid);
      const link = await auth.generatePasswordResetLink(target.email, {
        url: "https://baticamigo-website.vercel.app/admin/login",
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
      url: "https://baticamigo-website.vercel.app/admin/login",
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
    const body = await request.json();
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
    const { uid } = await request.json();
    const targetUid = String(uid || "").trim();
    if (!targetUid) throw new ApiError(400, "Selecione uma conta válida.");
    if (targetUid === decoded.uid) throw new ApiError(400, "Não pode remover a sua própria conta.");

    const target = await auth.getUser(targetUid);
    if (isAdmin({ email: target.email, admin: target.customClaims?.admin })) {
      const activeAdmins = (await listAllUsers(auth)).filter((user) => !user.disabled && isAdmin({ email: user.email, admin: user.customClaims?.admin }));
      if (activeAdmins.length <= 1) throw new ApiError(400, "Não pode remover a última conta administrativa ativa.");
    }
    await auth.deleteUser(targetUid);
    return json({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
