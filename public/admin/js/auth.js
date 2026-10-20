import { auth } from "./firebaseConfig.js"

document.addEventListener("DOMContentLoaded", () => {
  // Referências aos elementos do DOM
  const loginForm = document.getElementById("login-form")
  const loginError = document.getElementById("login-error")
  const loginStatus = document.getElementById("login-status")
  const emailInput = document.getElementById("email")
  const resetPasswordLink = document.getElementById("reset-password-link")

  // Verificar se o usuário já está autenticado
  auth.onAuthStateChanged(async (user) => {
    if (!user) return
    try {
      if (await validateAdminAccount(user)) window.location.href = "/admin/dashboard"
      else {
        await auth.signOut()
        showError("Esta conta não tem acesso ao painel administrativo.")
      }
    } catch (error) {
      console.error("Erro ao validar permissões administrativas:", error)
      showError("Não foi possível validar o acesso. Tente novamente mais tarde.")
    }
  })

  async function validateAdminAccount(user) {
    const token = await user.getIdToken()
    const response = await fetch("/api/admin/users?check=1", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
    if (response.status === 401 || response.status === 403) return false
    if (!response.ok) throw new Error("A validação de acesso falhou.")
    const result = await response.json()
    if (result.refreshToken) await user.getIdToken(true)
    return true
  }

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

  if (new URLSearchParams(window.location.search).get("access") === "denied") {
    showError("Esta conta não tem acesso ao painel administrativo.")
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
        const credential = await auth.signInWithEmailAndPassword(email, password)
        if (!await validateAdminAccount(credential.user)) {
          await auth.signOut()
          showError("Esta conta não tem acesso ao painel administrativo.")
          return
        }
        // Redirecionar para o dashboard após validar as permissões.
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

