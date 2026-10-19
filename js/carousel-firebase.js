// Carrossel para o banner inicial usando dados do Firebase
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Inicializando carrossel com dados do Firebase...")

  // Elementos do carrossel
  const carousel = document.querySelector(".carousel")
  const carouselInner = document.querySelector(".carousel-inner")
  const carouselIndicators = document.querySelector(".carousel-indicators")

  if (!carousel || !carouselInner || !carouselIndicators) {
    console.error("Elementos do carrossel não encontrados")
    return
  }

  // Verificar se o Firebase está inicializado
  if (typeof firebase === "undefined") {
    console.error("Firebase não está inicializado. Verifique se os scripts do Firebase foram carregados.")
    return
  }

  try {
    // Carregar dados em destaque
    const destaques = await carregarDestaques()
    if (!destaques.length) {
      console.error("Nenhum item em destaque encontrado")
      // Criar um slide padrão
      carouselInner.innerHTML = `
        <div class="carousel-slide active" style="background-image: url('https://firebasestorage.googleapis.com/v0/b/baticamigo-c0384.firebasestorage.app/o/logo.png?alt=media&token=77f706ee-7d07-4465-a37d-e463b03c97b7')">
          <div class="carousel-overlay"></div>
          <div class="carousel-pattern"></div>
          <div class="carousel-content">
            <h2>BaticAmigo</h2>
            <p>Transformando vidas através do esporte, cultura, educação e apoio social</p>
            <a href="#contato" class="btn primary-btn">Entre em Contato</a>
          </div>
        </div>
      `
      return
    }

    // Limpar conteúdo atual
    carouselInner.innerHTML = ""
    carouselIndicators.innerHTML = ""

    // Criar slides
    destaques.forEach((item, index) => {
      console.log("Item de destaque:", item)
      // Criar slide
      const slide = document.createElement("div")
      slide.className = `carousel-slide ${index === 0 ? "active" : ""}`
      slide.style.backgroundImage = `url(${item.imagem || "https://firebasestorage.googleapis.com/v0/b/baticamigo-c0384.firebasestorage.app/o/logo.png?alt=media&token=77f706ee-7d07-4465-a37d-e463b03c97b7"})`

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

  // Função para carregar itens em destaque do Firebase
  async function carregarDestaques() {
    try {
      const db = firebase.firestore()

      // Carregar dados de diferentes coleções
      const [eventosSnapshot, agendaSnapshot, noticiasSnapshot] = await Promise.all([
        db.collection("eventos").where("destaque", "==", true).get(),
        db.collection("agenda").where("destaque", "==", true).get(),
        db.collection("noticias").where("destaque", "==", true).get(),
      ])

      // Processar eventos em destaque
      const eventosDestaque = []
      eventosSnapshot.forEach((doc) => {
        const evento = doc.data()
        eventosDestaque.push({
          ...evento,
          tipo: "evento",
          titulo: evento.nome,
          link: "#eventos",
          botaoTexto: "Ver Eventos",
          imagem: evento.imagem
        })
      })

      // Processar agenda em destaque
      const agendaDestaque = []
      agendaSnapshot.forEach((doc) => {
        const item = doc.data()
        agendaDestaque.push({
          ...item,
          tipo: "agenda",
          titulo: item.nome,
          link: "#agenda",
          botaoTexto: "Ver Agenda",
          imagem: item.galeria[0].url
        })
        console.log("Item de agenda:", item)
      })

      // Processar notícias em destaque
      const noticiasDestaque = []
      noticiasSnapshot.forEach((doc) => {
        const noticia = doc.data()
        noticiasDestaque.push({
          ...noticia,
          tipo: "noticia",
          link: noticia.link || "#noticias",
          botaoTexto: "Ler Mais",
        })
      })

      // Adicionar item de contato
      const contatoDestaque = {
        titulo: "Entre em Contato",
        descricao: "Estamos à disposição para responder suas dúvidas e receber sugestões. Entre em contato conosco!",
        imagem: "https://firebasestorage.googleapis.com/v0/b/baticamigo-c0384.firebasestorage.app/o/logo.png?alt=media&token=77f706ee-7d07-4465-a37d-e463b03c97b7?text=Entre+em+Contato",
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
})

