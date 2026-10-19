const functions = require("firebase-functions")
const admin = require("firebase-admin")
const nodemailer = require("nodemailer")

admin.initializeApp()

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
    throw new functions.https.HttpsError("unauthenticated", "O usuário deve estar autenticado para enviar emails.")
  }

  const { to, subject, text, html } = data

  // Validar dados
  if (!to || !subject || (!text && !html)) {
    throw new functions.https.HttpsError("invalid-argument", "Dados inválidos para envio de email.")
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
    console.error("Erro ao enviar email:", error)
    throw new functions.https.HttpsError("internal", "Erro ao enviar email.", error)
  }
})

// Função para enviar email quando uma nova mensagem de contato for adicionada
exports.sendContactEmail = functions.firestore.document("contato/{contactId}").onCreate(async (snap, context) => {
  const contactData = snap.data()

  // Configurar email
  const mailOptions = {
    from: functions.config().email.user,
    to: "carlos.gomes@baticamigo.com",
    subject: `Nova mensagem de contato: ${contactData.assunto}`,
    text: `
                Nome: ${contactData.nome}
                Email: ${contactData.email}
                Assunto: ${contactData.assunto}
                Data: ${new Date().toLocaleString("pt-BR")}
                
                Mensagem:
                ${contactData.mensagem}
            `,
    html: `
                <h2>Nova mensagem de contato</h2>
                <p><strong>Nome:</strong> ${contactData.nome}</p>
                <p><strong>Email:</strong> ${contactData.email}</p>
                <p><strong>Assunto:</strong> ${contactData.assunto}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
                <h3>Mensagem:</h3>
                <p>${contactData.mensagem.replace(/\n/g, "<br>")}</p>
            `,
  }

  try {
    // Enviar email
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Erro ao enviar email de contato:", error)
    return { success: false, error }
  }
})

