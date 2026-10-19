// Script de depuração para o botão "Entre em Contato"
document.addEventListener("DOMContentLoaded", () => {
  console.log("Script de depuração do botão 'Entre em Contato' carregado")

  // Verificar se o botão existe
  const contactButton = document.querySelector('.hero-content a[href="#contato"]')
  if (contactButton) {
    console.log("Botão 'Entre em Contato' encontrado")

    // Adicionar evento de clique com log
    contactButton.addEventListener("click", (e) => {
      console.log("Botão 'Entre em Contato' clicado")
      e.preventDefault()

      // Verificar se a seção de contato existe
      const contactSection = document.querySelector("#contato")
      if (contactSection) {
        console.log("Seção de contato encontrada, rolando até ela")
        const headerHeight = document.querySelector("#header").offsetHeight
        const contactPosition = contactSection.getBoundingClientRect().top + window.scrollY - headerHeight

        // Rolar até a seção de contato
        window.scrollTo({
          top: contactPosition,
          behavior: "smooth",
        })
      } else {
        console.error("Seção de contato NÃO encontrada")
      }
    })
  } else {
    console.error("Botão 'Entre em Contato' NÃO encontrado")
  }
})

