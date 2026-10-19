import { auth } from "./firebaseConfig.js"

document.addEventListener("DOMContentLoaded", () => {
  // Referências aos elementos do DOM
  const loginForm = document.getElementById("login-form")
  const loginError = document.getElementById("login-error")
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
    loginError.textContent = message
    loginError.style.display = "block"
  }

  // Função para limpar mensagem de erro
  function clearError() {
    loginError.textContent = ""
    loginError.style.display = "none"
  }

  // Evento de envio do formulário de login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      clearError()

      const email = loginForm.email.value
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
            showError("Senha incorreta. Tente novamente.")
            break
          case "auth/invalid-email":
            showError("Email inválido. Verifique o formato.")
            break
          case "auth/too-many-requests":
            showError("Muitas tentativas de login. Tente novamente mais tarde.")
            break
          default:
            showError("Erro ao fazer login. Tente novamente.")
        }
      }
    })
  }

  // Evento para redefinição de senha
  if (resetPasswordLink) {
    resetPasswordLink.addEventListener("click", async (e) => {
      e.preventDefault()
      clearError()

      const email = prompt("Digite seu email para redefinir a senha:")

      if (!email) return

      try {
        await auth.sendPasswordResetEmail(email)
        alert("Email de redefinição de senha enviado. Verifique sua caixa de entrada.")
      } catch (error) {
        console.error("Erro ao enviar email de redefinição:", error)

        switch (error.code) {
          case "auth/user-not-found":
            showError("Usuário não encontrado. Verifique seu email.")
            break
          case "auth/invalid-email":
            showError("Email inválido. Verifique o formato.")
            break
          default:
            showError("Erro ao enviar email de redefinição. Tente novamente.")
        }
      }
    })
  }
})

