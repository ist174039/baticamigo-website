// Script para corrigir problemas de visibilidade
document.addEventListener("DOMContentLoaded", () => {
  console.log("Script de correção de visibilidade carregado")

  // Função para garantir que todas as seções estejam visíveis
  function fixVisibility() {
    // Selecionar todas as seções
    const sections = document.querySelectorAll("section")
    console.log(`Corrigindo visibilidade de ${sections.length} seções...`)

    // Forçar visibilidade de cada seção
    sections.forEach((section) => {
      // Aplicar estilos diretamente
      section.style.display = "block"
      section.style.visibility = "visible"
      section.style.opacity = "1"
      section.style.position = "relative" // Garantir que a posição não seja 'absolute'
      section.style.zIndex = "1" // Garantir um z-index positivo

      console.log(`Seção ${section.id || "sem ID"} configurada como visível`)
    })

    // Verificar se o carrossel está afetando outras seções
    const carousel = document.querySelector(".carousel")
    if (carousel) {
      carousel.style.position = "relative"
      carousel.style.zIndex = "1"
      console.log("Carrossel configurado para não interferir com outras seções")
    }
  }

  // Executar a correção após um pequeno atraso para garantir que o DOM esteja pronto
  setTimeout(fixVisibility, 500)

  // Executar novamente após 2 segundos para garantir que nada mudou
  setTimeout(fixVisibility, 2000)

  // Adicionar botão de correção na página
  const fixButton = document.createElement("button")
  fixButton.textContent = "Corrigir Visibilidade"
  fixButton.style.position = "fixed"
  fixButton.style.bottom = "20px"
  fixButton.style.right = "20px"
  fixButton.style.zIndex = "9999"
  fixButton.style.padding = "10px 15px"
  fixButton.style.backgroundColor = "#8a4fff"
  fixButton.style.color = "white"
  fixButton.style.border = "none"
  fixButton.style.borderRadius = "5px"
  fixButton.style.cursor = "pointer"
  fixButton.style.fontWeight = "bold"

  fixButton.addEventListener("click", fixVisibility)

  document.body.appendChild(fixButton)

  // Adicionar evento para o botão "Entre em Contato"
  const contactButtons = document.querySelectorAll('a[href="#contato"]')
  contactButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault()
      const contactSection = document.querySelector("#contato")
      if (contactSection) {
        const headerHeight = document.querySelector("#header")?.offsetHeight || 0
        window.scrollTo({
          top: contactSection.offsetTop - headerHeight,
          behavior: "smooth",
        })
        console.log("Rolando para a seção de contato")
      } else {
        console.error("Seção de contato não encontrada")
      }
    })
  })
})

