// Carrossel simplificado que não interfere com outras seções
document.addEventListener("DOMContentLoaded", () => {
  console.log("Carregando carrossel simplificado...")

  // Elementos do carrossel
  const carousel = document.querySelector(".carousel")

  // Se não encontrar o carrossel, não fazer nada
  if (!carousel) {
    console.error("Elemento do carrossel não encontrado")
    return
  }

  // Criar estrutura básica do carrossel
  carousel.innerHTML = `
    <div class="carousel-inner">
      <div class="carousel-slide active" style="background-image: url('images/hero-main.jpg')">
        <div class="carousel-overlay"></div>
        <div class="carousel-pattern"></div>
        <div class="carousel-content">
          <h2>BaticAmigo</h2>
          <p>Transformando vidas através do esporte, cultura, educação e apoio social</p>
          <a href="#contato" class="btn primary-btn">Entre em Contato</a>
        </div>
      </div>
    </div>
    <div class="carousel-controls">
      <div class="carousel-indicators">
        <div class="carousel-indicator active" data-slide="0"></div>
      </div>
    </div>
  `

  // Garantir que o carrossel não afete outras seções
  setTimeout(() => {
    const sections = document.querySelectorAll("section")
    console.log(`Verificando ${sections.length} seções...`)

    sections.forEach((section) => {
      section.style.display = "block"
      section.style.visibility = "visible"
      section.style.opacity = "1"
      console.log(`Seção ${section.id || "sem ID"} configurada como visível`)
    })
  }, 500)

  // Adicionar evento para o botão "Entre em Contato"
  const contactButton = carousel.querySelector('a[href="#contato"]')
  if (contactButton) {
    contactButton.addEventListener("click", (e) => {
      e.preventDefault()
      const contactSection = document.querySelector("#contato")
      if (contactSection) {
        const headerHeight = document.querySelector("#header")?.offsetHeight || 0
        window.scrollTo({
          top: contactSection.offsetTop - headerHeight,
          behavior: "smooth",
        })
      }
    })
  }
})

