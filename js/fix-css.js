// Script para corrigir problemas de CSS
document.addEventListener("DOMContentLoaded", () => {
  console.log("Script de correção de CSS carregado")

  // Função para aplicar correções de CSS
  function fixCSS() {
    // Corrigir estilos do body
    document.body.style.overflowX = "visible"

    // Corrigir estilos das seções
    const sections = document.querySelectorAll("section")
    sections.forEach((section) => {
      // Aplicar estilos para garantir visibilidade
      section.style.display = "block"
      section.style.visibility = "visible"
      section.style.opacity = "1"
      section.style.position = "relative"
      section.style.zIndex = "1"
      section.style.overflow = "visible"

      // Remover quaisquer transformações que possam estar escondendo a seção
      section.style.transform = "none"
    })

    // Corrigir estilos do carrossel
    const carousel = document.querySelector(".carousel")
    if (carousel) {
      carousel.style.position = "relative"
      carousel.style.zIndex = "1"
      carousel.style.overflow = "hidden"
      carousel.style.height = "100vh"
    }

    // Corrigir estilos do header
    const header = document.querySelector("#header")
    if (header) {
      header.style.position = "fixed"
      header.style.top = "0"
      header.style.left = "0"
      header.style.width = "100%"
      header.style.zIndex = "1000"
    }

    console.log("Correções de CSS aplicadas")
  }

  // Executar correções após um pequeno atraso
  setTimeout(fixCSS, 500)

  // Executar novamente após o carregamento completo da página
  window.addEventListener("load", fixCSS)
})

