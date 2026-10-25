import { getFirestore } from "firebase-admin/firestore";
import { adminServices, assertJsonRequest } from "../../../../lib/platform/server";
import { adminAuthorization } from "../../../../lib/platform/access.mjs";
import { platformContinueUrl } from "../../../../lib/platform/continue-url.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectId = "baticamigo-c0384";
class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function firebaseAuth() {
  return adminServices().auth;
}

async function readJson(request) {
  assertJsonRequest(request);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16384) throw new ApiError(413, "Pedido demasiado grande.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Pedido vazio.");
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) { await reader.cancel(); throw new ApiError(413, "Pedido demasiado grande."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ApiError(400, "JSON inválido."); }
}

async function requireAdmin(request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new ApiError(401, "Inicie sessão para continuar.");
  const auth = firebaseAuth();
  let decoded;
  try { decoded = await auth.verifyIdToken(token, true); }
  catch { throw new ApiError(401, "A sessão expirou. Inicie sessão novamente."); }
  const accountSnapshot = await getFirestore(auth.app).collection("platform_accounts").doc(decoded.uid).get();
  const account = accountSnapshot.exists ? accountSnapshot.data() : null;
  const authorization = adminAuthorization(decoded, account);
  if (authorization.verificationRequired) throw new ApiError(403, "Confirme o email da conta antes de gerir o site.");
  if (!authorization.authorized) throw new ApiError(403, "A sua conta não tem acesso à gestão do site.");
  return { auth, decoded };
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function problem(detail,status,code="admin/request-rejected",title="Pedido não concluído") {
  return Response.json(
    {type:"about:blank",title,status,detail,error:detail,code},
    {status,headers:{"Cache-Control":"no-store","Content-Type":"application/problem+json"}}
  );
}
function handleError(error) {
  if (error instanceof ApiError || Number.isInteger(error?.status)) return problem(error.message,error.status,error.code || "admin/request-rejected");
  const code = error?.code;
  if (code === "auth/user-not-found") return problem("A conta já não existe.",404,String(code),"Recurso não encontrado");
  console.error("Erro na gestão administrativa Firebase:", code || error?.message || "unknown");
  return problem("Não foi possível concluir a operação. Tente novamente.",500,String(code || "admin/server-error"),"Erro interno");
}

function passwordResetContinueUrl() {
  return platformContinueUrl();
}

function movedResponse() {
  return json({ error: "A gestão de utilizadores foi centralizada na Área.", code: "admin/user-management-moved" }, 410);
}

export async function GET(request) {
  try {
    const { auth } = await requireAdmin(request);
    const url = new URL(request.url);
    if (url.searchParams.get("check") === "1") return json({ authorized: true, refreshToken: false });
    const collectionName = url.searchParams.get("collection");
    if (collectionName === "membros" || collectionName === "parceiros") {
      const snapshot = await getFirestore(auth.app).collection(collectionName).get();
      return json({ documents: snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })) });
    }
    return movedResponse();
  } catch (error) { return handleError(error); }
}

export async function POST(request) {
  try {
    const { auth, decoded } = await requireAdmin(request);
    const body = await readJson(request);
    if (body.action !== "reset-password") return movedResponse();
    const uid = String(body.uid || "").trim();
    if (!uid || uid !== decoded.uid) throw new ApiError(403, "A recuperação de palavra-passe é feita na própria conta.");
    const target = await auth.getUser(uid);
    const link = await auth.generatePasswordResetLink(target.email, {
      url: passwordResetContinueUrl(),
      handleCodeInApp: false,
    });
    return json({ resetLink: link });
  } catch (error) { return handleError(error); }
}

export async function PATCH() { return movedResponse(); }
export async function DELETE() { return movedResponse(); }
