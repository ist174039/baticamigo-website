// Script de inicialização para garantir que todas as seções sejam visíveis
document.addEventListener("DOMContentLoaded", () => {
  console.log("Script de inicialização carregado")

  // Garantir que todas as seções sejam visíveis
  setTimeout(() => {
    const sections = document.querySelectorAll("section")
    console.log(`Verificando ${sections.length} seções...`)

    sections.forEach((section, index) => {
      // Garantir que a seção esteja visível
      if (section.style.display === "none") {
        console.log(`Ajustando visibilidade da seção #${index + 1} (${section.id || "sem ID"})`)
        section.style.display = "block"
      }

      // Verificar se a seção tem conteúdo
      if (section.innerHTML.trim() === "") {
        console.log(`Seção vazia detectada: #${index + 1} (${section.id || "sem ID"})`)
      }
    })
  }, 1000) // Verificar após 1 segundo para garantir que o DOM esteja completamente carregado
})

