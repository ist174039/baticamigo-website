// Carrossel para o banner inicial
document.addEventListener("DOMContentLoaded", async () => {
  // Elementos do carrossel
  const carousel = document.querySelector(".carousel")
  const carouselInner = document.querySelector(".carousel-inner")
  const carouselIndicators = document.querySelector(".carousel-indicators")

  if (!carousel || !carouselInner || !carouselIndicators) {
    console.error("Elementos do carrossel não encontrados")
    return
  }

  try {
    // Carregar dados em destaque
    const destaques = await carregarDestaques()
    if (!destaques.length) {
      console.error("Nenhum item em destaque encontrado")
      return
    }

    // Limpar conteúdo atual
    carouselInner.innerHTML = ""
    carouselIndicators.innerHTML = ""

    // Criar slides
    destaques.forEach((item, index) => {
      // Criar slide
      const slide = document.createElement("div")
      slide.className = `carousel-slide ${index === 0 ? "active" : ""}`
      slide.style.backgroundImage = `url(${item.imagem})`

      // Criar conteúdo do slide
      slide.innerHTML = `
        <div class="carousel-overlay"></div>
        <div class="carousel-pattern"></div>
        <div class="carousel-content">
          <h2>${item.titulo || item.nome}</h2>
          <p>${item.descricao}</p>
          <a href="${item.link}" class="btn primary-btn">${item.botaoTexto}</a>
        </div>
      `

      carouselInner.appendChild(slide)

      // Criar indicador
      const indicator = document.createElement("div")
      indicator.className = `carousel-indicator ${index === 0 ? "active" : ""}`
      indicator.dataset.slide = index
      indicator.addEventListener("click", () => {
        goToSlide(index)
      })

      carouselIndicators.appendChild(indicator)
    })

    // Configurar navegação
    const prevButton = document.querySelector(".carousel-prev")
    const nextButton = document.querySelector(".carousel-next")

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        goToSlide(currentSlide - 1)
      })
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        goToSlide(currentSlide + 1)
      })
    }

    // Variáveis de controle
    let currentSlide = 0
    const slides = document.querySelectorAll(".carousel-slide")
    const indicators = document.querySelectorAll(".carousel-indicator")
    const totalSlides = slides.length

    // Função para ir para um slide específico
    function goToSlide(index) {
      // Lidar com índices fora do intervalo
      if (index < 0) {
        index = totalSlides - 1
      } else if (index >= totalSlides) {
        index = 0
      }

      // Remover classe active de todos os slides e indicadores
      slides.forEach((slide) => slide.classList.remove("active"))
      indicators.forEach((indicator) => indicator.classList.remove("active"))

      // Adicionar classe active ao slide e indicador atual
      slides[index].classList.add("active")
      indicators[index].classList.add("active")

      // Atualizar slide atual
      currentSlide = index
    }

    // Iniciar rotação automática
    let autoRotate = setInterval(() => {
      goToSlide(currentSlide + 1)
    }, 5000)

    // Pausar rotação ao passar o mouse sobre o carrossel
    carousel.addEventListener("mouseenter", () => {
      clearInterval(autoRotate)
    })

    // Retomar rotação ao remover o mouse do carrossel
    carousel.addEventListener("mouseleave", () => {
      autoRotate = setInterval(() => {
        goToSlide(currentSlide + 1)
      }, 5000)
    })
  } catch (error) {
    console.error("Erro ao inicializar o carrossel:", error)
    // Se houver erro no carrossel, não deve afetar o resto da página
    document.querySelectorAll("section").forEach((section) => {
      section.style.display = "block"
    })
  }

  // Função para carregar itens em destaque
  async function carregarDestaques() {
    try {
      // Carregar dados de diferentes fontes
      const eventos = await loadData("data/eventos.json")
      const agenda = await loadData("data/agenda.json")
      const noticias = await loadData("data/noticias.json")

      // Filtrar itens em destaque
      const eventosDestaque = eventos
        .filter((item) => item.destaque)
        .map((item) => ({
          ...item,
          tipo: "evento",
          titulo: item.nome,
          link: "#eventos",
          botaoTexto: "Ver Eventos",
        }))

      const agendaDestaque = agenda
        .filter((item) => item.destaque)
        .map((item) => ({
          ...item,
          tipo: "agenda",
          titulo: item.nome,
          link: "#agenda",
          botaoTexto: "Ver Agenda",
        }))

      const noticiasDestaque = noticias
        .filter((item) => item.destaque)
        .map((item) => ({
          ...item,
          tipo: "noticia",
          botaoTexto: "Ler Mais",
        }))

      // Adicionar item de contato
      const contatoDestaque = {
        titulo: "Entre em Contato",
        descricao: "Estamos à disposição para responder suas dúvidas e receber sugestões. Entre em contato conosco!",
        imagem: "images/hero-main.jpg",
        tipo: "contato",
        link: "#contato",
        botaoTexto: "Contatar",
      }

      // Combinar todos os destaques
      return [...noticiasDestaque, ...eventosDestaque, ...agendaDestaque, contatoDestaque]
    } catch (error) {
      console.error("Erro ao carregar destaques:", error)
      return []
    }
  }

  // Função para carregar dados de um arquivo JSON
  async function loadData(url) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Erro ao carregar dados de ${url}:`, error)
      return []
    }
  }
})

