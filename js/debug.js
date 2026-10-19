// Script de depuração para verificar se os eventos estão sendo registrados
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado completamente")

  // Verificar botões de idioma
  const langButtons = document.querySelectorAll(".lang-btn")
  console.log("Botões de idioma encontrados:", langButtons.length)

  langButtons.forEach((btn) => {
    console.log("Botão de idioma:", btn.getAttribute("data-lang"))

    // Adicionar evento de clique com log
    btn.addEventListener("click", function () {
      console.log("Botão de idioma clicado:", this.getAttribute("data-lang"))
    })
  })

  // Verificar botão "Entre em Contato"
  const contactButton = document.querySelector('a[href="#contato"]')
  if (contactButton) {
    console.log("Botão 'Entre em Contato' encontrado")

    contactButton.addEventListener("click", (e) => {
      console.log("Botão 'Entre em Contato' clicado")
      e.preventDefault()

      const contactSection = document.querySelector("#contato")
      if (contactSection) {
        const headerHeight = document.querySelector("#header").offsetHeight
        const contactPosition = contactSection.getBoundingClientRect().top + window.pageYOffset - headerHeight

        window.scrollTo({
          top: contactPosition,
          behavior: "smooth",
        })
      }
    })
  } else {
    console.log("Botão 'Entre em Contato' NÃO encontrado")
  }
})

