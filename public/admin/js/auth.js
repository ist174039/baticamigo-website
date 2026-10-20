import { auth } from "./firebaseConfig.js"

document.addEventListener("DOMContentLoaded", () => {
  // Referências aos elementos do DOM
  const loginForm = document.getElementById("login-form")
  const loginError = document.getElementById("login-error")
  const loginStatus = document.getElementById("login-status")
  const emailInput = document.getElementById("email")
  const resetPasswordLink = document.getElementById("reset-password-link")

  // Verificar se o usuário já está autenticado
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Redirecionar para o dashboard se já estiver autenticado
      window.location.href = "/admin/dashboard"
    }
  })

  // Função para exibir mensagem de erro
  function showError(message) {
    if (loginStatus) loginStatus.hidden = true
    if (!loginError) return
    loginError.textContent = message
    loginError.hidden = false
    loginError.style.display = "block"
  }

  // Função para limpar mensagem de erro
  function clearError() {
    if (!loginError) return
    loginError.textContent = ""
    loginError.hidden = true
    loginError.style.display = ""
  }

  function showStatus(message) {
    if (!loginStatus) return
    if (loginError) loginError.hidden = true
    loginStatus.textContent = message
    loginStatus.hidden = false
  }

  // Evento de envio do formulário de login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      clearError()
      if (loginStatus) loginStatus.hidden = true

      const submitButton = loginForm.querySelector("button[type=submit]")
      const submitLabel = submitButton?.querySelector(".login-submit-label")
      const originalLabel = submitLabel?.textContent
      if (submitButton) submitButton.disabled = true
      if (submitLabel) submitLabel.textContent = "A verificar…"

      const email = emailInput?.value.trim() || ""
      const password = loginForm.password.value

      try {
        // Tentativa de login
        await auth.signInWithEmailAndPassword(email, password)
        // Redirecionar para o dashboard após login bem-sucedido
        window.location.href = "/admin/dashboard"
      } catch (error) {
        console.error("Erro de autenticação:", error)

        // Tratamento de erros específicos
        switch (error.code) {
          case "auth/user-not-found":
            showError("Usuário não encontrado. Verifique seu email.")
            break
          case "auth/wrong-password":
          case "auth/invalid-credential":
          case "auth/invalid-login-credentials":
            showError("Senha incorreta. Tente novamente.")
            break
          case "auth/invalid-email":
            showError("Email inválido. Verifique o formato.")
            break
          case "auth/too-many-requests":
            showError("Muitas tentativas de login. Tente novamente mais tarde.")
            break
          case "auth/network-request-failed":
            showError("Sem ligação ao serviço de acesso. Verifique a sua ligação e tente novamente.")
            break
          default:
            showError("Erro ao fazer login. Tente novamente.")
        }
      } finally {
        if (submitButton) submitButton.disabled = false
        if (submitLabel && originalLabel) submitLabel.textContent = originalLabel
      }
    })
  }

  // Evento para redefinição de senha
  if (resetPasswordLink) {
    resetPasswordLink.addEventListener("click", async (e) => {
      e.preventDefault()
      clearError()
      if (loginStatus) loginStatus.hidden = true

      const email = emailInput?.value.trim() || ""
      if (!email) {
        showError("Introduza o seu email no campo acima para receber a ligação de recuperação.")
        emailInput?.focus()
        return
      }

      try {
        await auth.sendPasswordResetEmail(email)
        showStatus("Enviámos uma ligação de recuperação para o seu email.")
      } catch (error) {
        console.error("Erro ao enviar email de redefinição:", error)

        switch (error.code) {
          case "auth/user-not-found":
            showError("Usuário não encontrado. Verifique seu email.")
            break
          case "auth/invalid-email":
            showError("Email inválido. Verifique o formato.")
            break
          case "auth/network-request-failed":
            showError("Sem ligação ao serviço de acesso. Verifique a sua ligação e tente novamente.")
            break
          default:
            showError("Erro ao enviar email de redefinição. Tente novamente.")
        }
      }
    })
  }
})

