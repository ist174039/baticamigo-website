// Formulário público mediado pela API server-side.
document.addEventListener("DOMContentLoaded", () => {
  const messageSuccess = document.getElementById("messageSuccess")
  const messageError = document.getElementById("messageError")
  const contactForm = document.getElementById("contactForm")
  if (!contactForm) return

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault()
    if (!validateForm()) return
    const submit = contactForm.querySelector('button[type="submit"]')
    if (submit.disabled) return
    submit.disabled = true
    contactForm.setAttribute("aria-busy", "true")
    try {
      const values = new FormData(contactForm)
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          name: String(values.get("name") || ""),
          email: String(values.get("email") || ""),
          subject: String(values.get("subject") || ""),
          message: String(values.get("message") || ""),
          website: String(values.get("website") || ""),
        }),
      })
      if (!response.ok) throw new Error("contact rejected")
      messageSuccess.style.display = "block"
      messageError.style.display = "none"
      clearForm()
    } catch {
      messageError.style.display = "block"
      messageSuccess.style.display = "none"
    } finally {
      submit.disabled = false
      contactForm.removeAttribute("aria-busy")
    }
  })

  function clearForm() {
    contactForm.reset()
    setTimeout(() => {
      if (messageError) messageError.style.display = "none"
      if (messageSuccess) messageSuccess.style.display = "none"
    }, 5000)
  }

  function validateForm() {
    const name = contactForm.elements.name.value
    const email = contactForm.elements.email.value
    const subject = contactForm.elements.subject.value
    const message = contactForm.elements.message.value
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pairs = [
      ["name-error", Boolean(name && name.trim())],
      ["email-error", Boolean(email && email.trim())],
      ["subject-error", Boolean(subject && subject.trim())],
      ["message-error", Boolean(message && message.trim())],
    ]
    for (const [id,valid] of pairs) document.getElementById(id).style.display = valid ? "none" : "block"
    if (pairs.some(([,valid]) => !valid)) return false
    const emailValid=emailPattern.test(email)
    document.getElementById("email-format-error").style.display=emailValid ? "none" : "block"
    return emailValid
  }
})
