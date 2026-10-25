const functions = require("firebase-functions")
const admin = require("firebase-admin")
const nodemailer = require("nodemailer")

admin.initializeApp()

const htmlEscape = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;")

const validEmail = (value) => typeof value === "string" && value.length <= 254 && /^\S+@\S+\.\S+$/.test(value)

async function canSendAdministrativeEmail(context) {
  if (!context.auth || context.auth.token.email_verified !== true) return false
  const account = await admin.firestore().collection("platform_accounts").doc(context.auth.uid).get()
  if (account.exists) {
    const value = account.data() || {}
    const roles = Array.isArray(value.roles) ? value.roles : [value.role]
    return value.active === true && value.suspended !== true && roles.includes("admin")
  }
  return context.auth.token.admin === true
}

// Configuração do transporte de email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password,
  },
})

// Função para enviar email
exports.sendEmail = functions.https.onCall(async (data, context) => {
  // Verificar se o usuário está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Inicie sessão para continuar.")
  }
  if (!(await canSendAdministrativeEmail(context))) throw new functions.https.HttpsError("permission-denied", "Sem permissão para enviar emails.")

  const { to, subject, text, html } = data

  // Validar dados
  if (!validEmail(to) || typeof subject !== "string" || !subject.trim() || subject.length > 200 || /[\r\n]/.test(subject) || (!text && !html)) {
    throw new functions.https.HttpsError("invalid-argument", "Dados inválidos para envio de email.")
  }
  if ((text && (typeof text !== "string" || text.length > 10000)) || (html && (typeof html !== "string" || html.length > 20000))) {
    throw new functions.https.HttpsError("invalid-argument", "O conteúdo do email excede o limite permitido.")
  }

  // Configurar email
  const mailOptions = {
    from: functions.config().email.user,
    to,
    subject,
    text,
    html,
  }

  try {
    // Enviar email
    await transporter.sendMail(mailOptions)
    return { success: true, message: "Email enviado com sucesso!" }
  } catch (error) {
    console.error("Erro ao enviar email:", error?.code || "mail-send-failed")
    throw new functions.https.HttpsError("internal", "Erro ao enviar email.")
  }
})

// Função para enviar email quando uma nova mensagem de contato for adicionada
exports.sendContactEmail = functions.firestore.document("contato/{contactId}").onCreate(async () => {
  const contactRecipient = String(functions.config().email?.contact_to || "").trim()
  if (!validEmail(contactRecipient)) {
    console.error("Destinatário de contacto não configurado.")
    return { success: false, error: "contact-recipient-not-configured" }
  }

  const mailOptions = {
    from: functions.config().email.user,
    to: contactRecipient,
    subject: "Nova mensagem de contacto na BaticAmigo",
    text: "Existe uma nova mensagem de contacto. Consulte-a no painel administrativo da BaticAmigo.",
    html: "<p>Existe uma nova mensagem de contacto. Consulte-a no painel administrativo da BaticAmigo.</p>",
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Erro ao enviar email de contacto.")
    return { success: false, error: "contact-notification-failed" }
  }
})

