// Script para verificar a visibilidade das seções
document.addEventListener("DOMContentLoaded", () => {
  console.log("Verificador de visibilidade carregado")

  // Função para verificar visibilidade
  function checkVisibility() {
    const sections = document.querySelectorAll("section")
    console.log(`Verificando visibilidade de ${sections.length} seções...`)

    sections.forEach((section, index) => {
      const id = section.id || `sem-id-${index}`
      const computed = window.getComputedStyle(section)

      console.log(`Seção #${index + 1} (${id}):`, {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        height: computed.height,
        position: computed.position,
        zIndex: computed.zIndex,
      })

      // Verificar se a seção está realmente visível
      const rect = section.getBoundingClientRect()
      console.log(`   Posição: top=${rect.top}, bottom=${rect.bottom}, height=${rect.height}`)

      // Se a seção não estiver visível, forçar a visibilidade
      if (computed.display === "none" || computed.visibility === "hidden" || computed.opacity === "0") {
        console.log(`   Corrigindo visibilidade da seção ${id}`)
        section.style.display = "block"
        section.style.visibility = "visible"
        section.style.opacity = "1"
      }
    })
  }

  // Verificar visibilidade após o carregamento e depois de 2 segundos
  checkVisibility()
  setTimeout(checkVisibility, 2000)

  // Adicionar botão de verificação na página
  const checkButton = document.createElement("button")
  checkButton.textContent = "Verificar Visibilidade"
  checkButton.style.position = "fixed"
  checkButton.style.bottom = "20px"
  checkButton.style.right = "20px"
  checkButton.style.zIndex = "9999"
  checkButton.style.padding = "10px"
  checkButton.style.backgroundColor = "#8a4fff"
  checkButton.style.color = "white"
  checkButton.style.border = "none"
  checkButton.style.borderRadius = "5px"
  checkButton.style.cursor = "pointer"

  checkButton.addEventListener("click", checkVisibility)

  document.body.appendChild(checkButton)
})

