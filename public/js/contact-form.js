// Script para envio de email do formulário de contato
document.addEventListener("DOMContentLoaded", () => {
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
    console.log("Formulário enviado")

    if (validateForm()) {
      console.log("Formulário validado com sucesso")
      var myHeaders = new Headers()
      myHeaders.append("x-client-id", "U2FsdGVkX18PMYiTblRzFdGeLh2VnKjRO+MF5Fe5xXka81oVaVCyhAICKQweWMfe")
      myHeaders.append("app", "ND")
      myHeaders.append("Content-Type", "application/json")

      const name = document.forms["contactForm"]["name"].value
      const email = document.forms["contactForm"]["email"].value
      const subject = document.forms["contactForm"]["subject"].value
      const message = document.forms["contactForm"]["message"].value

      var data = JSON.stringify({
        name: name,
        email: email,
        subject: subject,
        message: message,
      })

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: data,
      }

      try {
        const response = await fetch("https://api.nantoidigital.com/api/v1/send-email", requestOptions)
        const result = await response.json()
        console.log("Resposta da API:", result)

        messageSuccess.style.display = "block"
        messageError.style.display = "none"
        clearForm()
      } catch (error) {
        console.error("Erro ao enviar email:", error)
        messageError.style.display = "block"
        messageSuccess.style.display = "none"
        clearForm()
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
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/

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

