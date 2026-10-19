// Script de depuração para o carrossel
document.addEventListener("DOMContentLoaded", () => {
  console.log("Script de depuração do carrossel carregado")

  // Verificar se o carrossel existe
  const carousel = document.querySelector(".carousel")
  if (carousel) {
    console.log("Carrossel encontrado")
  } else {
    console.error("Carrossel NÃO encontrado")
  }

  // Verificar se as outras seções existem
  const sections = [
    "#missao",
    "#descricao",
    "#pilares",
    "#membros",
    "#parceiros",
    "#noticias",
    "#eventos",
    "#programas",
    "#agenda",
    "#contato",
  ]

  sections.forEach((section) => {
    const element = document.querySelector(section)
    if (element) {
      console.log(`Seção ${section} encontrada`)
    } else {
      console.error(`Seção ${section} NÃO encontrada`)
    }
  })
})

