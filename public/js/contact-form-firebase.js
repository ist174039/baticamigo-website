// Script para envio de email do formulário de contato usando Firebase
document.addEventListener("DOMContentLoaded", () => {

  // Verificar se o Firebase está inicializado
  if (typeof firebase === "undefined") {
    console.error("Firebase não está inicializado. Verifique se os scripts do Firebase foram carregados.")
    return
  }

  // Obter referências para as mensagens de sucesso e erro
  const messageSuccess = document.getElementById("messageSuccess")
  const messageError = document.getElementById("messageError")

  // Verificar se o formulário existe
  const contactForm = document.getElementById("contactForm")
  if (!contactForm) {
    console.error("Formulário de contato não encontrado!")
    return
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault()

    if (validateForm()) {

      const submit = contactForm.querySelector('button[type="submit"]')
      if (submit.disabled) return
      submit.disabled = true
      contactForm.setAttribute("aria-busy", "true")
      try {
        const db = firebase.firestore()

        const name = document.forms["contactForm"]["name"].value
        const email = document.forms["contactForm"]["email"].value
        const subject = document.forms["contactForm"]["subject"].value
        const message = document.forms["contactForm"]["message"].value

        // Salvar mensagem no Firestore
        await db.collection("contato").add({
          nome: name,
          email: email,
          assunto: subject,
          mensagem: message,
          data: firebase.firestore.FieldValue.serverTimestamp(),
          lido: false,
        })

        messageSuccess.style.display = "block"
        messageError.style.display = "none"
        clearForm()
      } catch (error) {
        console.error("Erro ao enviar mensagem:")
        messageError.style.display = "block"
        messageSuccess.style.display = "none"
      } finally {
        submit.disabled = false
        contactForm.removeAttribute("aria-busy")
      }
    }
  })

  function clearForm() {
    document.forms["contactForm"]["name"].value = ""
    document.forms["contactForm"]["email"].value = ""
    document.forms["contactForm"]["subject"].value = ""
    document.forms["contactForm"]["message"].value = ""

    setTimeout(() => {
      if (messageError) messageError.style.display = "none"
      if (messageSuccess) messageSuccess.style.display = "none"
    }, 5000)
  }

  function validateForm() {
    const name = document.forms["contactForm"]["name"].value
    const email = document.forms["contactForm"]["email"].value
    const subject = document.forms["contactForm"]["subject"].value
    const message = document.forms["contactForm"]["message"].value
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!validString(name)) {
      document.getElementById("name-error").style.display = "block"
      document.getElementById("email-error").style.display = "none"
      document.getElementById("subject-error").style.display = "none"
      document.getElementById("message-error").style.display = "none"
      return false
    }
    if (!validString(email)) {
      document.getElementById("name-error").style.display = "none"
      document.getElementById("email-error").style.display = "block"
      document.getElementById("subject-error").style.display = "none"
      document.getElementById("message-error").style.display = "none"
      return false
    }
    if (!validString(subject)) {
      document.getElementById("name-error").style.display = "none"
      document.getElementById("email-error").style.display = "none"
      document.getElementById("subject-error").style.display = "block"
      document.getElementById("message-error").style.display = "none"
      return false
    }
    if (!validString(message)) {
      document.getElementById("name-error").style.display = "none"
      document.getElementById("email-error").style.display = "none"
      document.getElementById("subject-error").style.display = "none"
      document.getElementById("message-error").style.display = "block"
      return false
    }

    if (!emailPattern.test(email)) {
      document.getElementById("email-format-error").style.display = "block"
      return false
    } else {
      document.getElementById("email-format-error").style.display = "none"
    }

    return true
  }

  function validString(input) {
    return input && input.trim()?.length > 0
  }
})

