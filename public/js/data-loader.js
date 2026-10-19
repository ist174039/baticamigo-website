// Função para formatar data
function formatDate(dateString) {
  const options = { day: "numeric", month: "long", year: "numeric" }
  return new Date(dateString).toLocaleDateString(document.documentElement.lang, options)
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

// Função para carregar e exibir membros
async function loadMembers() {
  const members = await loadData("data/membros.json")
  const container = document.getElementById("members-container")

  if (!container || !members.length) return

  container.innerHTML = ""

  members.forEach((member) => {
    const memberCard = document.createElement("div")
    memberCard.className = "member-card"

    memberCard.innerHTML = `
            <div class="member-image">
                <img src="${member.imagem || "images/placeholder-member.jpg"}" alt="${member.nome}">
            </div>
            <div class="member-info">
                <h3>${member.nome}</h3>
                <p class="member-position">${member.cargo}</p>
                <p>${member.descricao}</p>
            </div>
        `

    container.appendChild(memberCard)
  })
}

// Função para carregar e exibir parceiros
async function loadPartners() {
  const partners = await loadData("data/parceiros.json")
  const container = document.getElementById("partners-container")

  if (!container || !partners.length) return

  container.innerHTML = ""

  partners.forEach((partner) => {
    const partnerCard = document.createElement("div")
    partnerCard.className = "partner-card"

    partnerCard.innerHTML = `
            <div class="partner-logo">
                <img src="${partner.logo || "images/placeholder-logo.jpg"}" alt="${partner.nome}">
            </div>
            <div class="partner-info">
                <h3>${partner.nome}</h3>
                <p>${partner.descricao}</p>
                ${partner.website ? `<a href="${partner.website}" class="partner-website" target="_blank">Website</a>` : ""}
            </div>
        `

    container.appendChild(partnerCard)
  })
}

// Função para criar e abrir modal de galeria
function createGalleryModal() {
  // Verificar se o modal já existe
  if (document.getElementById("gallery-modal")) {
    return
  }

  // Criar elementos do modal
  const modal = document.createElement("div")
  modal.id = "gallery-modal"
  modal.className = "gallery-modal"

  modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close"><i class="fas fa-times"></i></button>
            <button class="modal-prev"><i class="fas fa-chevron-left"></i></button>
            <button class="modal-next"><i class="fas fa-chevron-right"></i></button>
            <div class="modal-media-container"></div>
            <p class="modal-caption"></p>
        </div>
    `

  document.body.appendChild(modal)

  // Fechar modal ao clicar no botão ou fora do conteúdo
  const closeBtn = modal.querySelector(".modal-close")
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active")
    const videoContainer = modal.querySelector("video")
    if (videoContainer) {
      videoContainer.pause()
    }
  })

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active")
      const videoContainer = modal.querySelector("video")
      if (videoContainer) {
        videoContainer.pause()
      }
    }
  })

  // Prevenir que o ESC feche o modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      modal.classList.remove("active")
      const videoContainer = modal.querySelector("video")
      if (videoContainer) {
        videoContainer.pause()
      }
    }
  })
}

// Função para abrir o modal da galeria
function openGalleryModal(items, currentIndex) {
  const modal = document.getElementById("gallery-modal")
  const mediaContainer = modal.querySelector(".modal-media-container")
  const caption = modal.querySelector(".modal-caption")
  const prevBtn = modal.querySelector(".modal-prev")
  const nextBtn = modal.querySelector(".modal-next")

  function showItem(index) {
    const item = items[index]
    mediaContainer.innerHTML = ""

    if (item.tipo === "imagem") {
      const img = document.createElement("img")
      img.src = item.url
      img.alt = item.legenda
      img.className = "modal-image"
      mediaContainer.appendChild(img)
    } else if (item.tipo === "video") {
      const video = document.createElement("video")
      video.src = item.url
      video.controls = true
      video.autoplay = true
      video.className = "modal-video"
      mediaContainer.appendChild(video)
    }

    caption.textContent = item.legenda
  }

  // Exibir item atual
  showItem(currentIndex)

  // Configurar navegação
  modal.dataset.currentIndex = currentIndex
  modal.dataset.totalItems = items.length

  prevBtn.onclick = () => {
    let newIndex = Number.parseInt(modal.dataset.currentIndex) - 1
    if (newIndex < 0) newIndex = items.length - 1
    modal.dataset.currentIndex = newIndex
    showItem(newIndex)
  }

  nextBtn.onclick = () => {
    let newIndex = Number.parseInt(modal.dataset.currentIndex) + 1
    if (newIndex >= items.length) newIndex = 0
    modal.dataset.currentIndex = newIndex
    showItem(newIndex)
  }

  // Mostrar ou esconder botões de navegação
  if (items.length <= 1) {
    prevBtn.style.display = "none"
    nextBtn.style.display = "none"
  } else {
    prevBtn.style.display = "block"
    nextBtn.style.display = "block"
  }

  // Exibir modal
  modal.classList.add("active")
}

// Função para criar galeria para um item
function createGallery(item, container, title) {
  if (!item.galeria || item.galeria.length === 0) {
    return
  }

  const gallerySection = document.createElement("div")
  gallerySection.className = "gallery"

  const galleryTitle = document.createElement("div")
  galleryTitle.className = "gallery-title"
  galleryTitle.innerHTML = `<i class="fas fa-chevron-down"></i> ${title || "Galeria"}`

  const galleryContent = document.createElement("div")
  galleryContent.className = "gallery-content"

  item.galeria.forEach((media, index) => {
    const galleryItem = document.createElement("div")
    galleryItem.className = `gallery-item ${media.tipo === "video" ? "video" : ""}`

    const thumbnail = document.createElement("img")
    thumbnail.src = media.tipo === "video" ? media.thumbnail : media.url
    thumbnail.alt = media.legenda

    galleryItem.appendChild(thumbnail)
    galleryContent.appendChild(galleryItem)

    galleryItem.addEventListener("click", () => {
      openGalleryModal(item.galeria, index)
    })
  })

  galleryTitle.addEventListener("click", () => {
    galleryTitle.classList.toggle("active")
    galleryContent.classList.toggle("active")
  })

  gallerySection.appendChild(galleryTitle)
  gallerySection.appendChild(galleryContent)
  container.appendChild(gallerySection)
}

// Função para carregar e exibir eventos
async function loadEvents() {
  const events = await loadData("data/eventos.json")
  const container = document.getElementById("events-container")
  const searchInput = document.getElementById("eventos-search")

  if (!container || !events.length) return

  function renderEvents(filteredEvents = events) {
    container.innerHTML = ""

    if (filteredEvents.length === 0) {
      container.innerHTML = '<p class="no-results">Nenhum evento encontrado.</p>'
      return
    }

    filteredEvents.forEach((event) => {
      const eventCard = document.createElement("div")
      eventCard.className = "event-card"

      const flagsHtml =
        event.flags && event.flags.length
          ? `<div class="event-flags">${event.flags.map((flag) => `<span class="event-flag">${flag}</span>`).join("")}</div>`
          : ""

      const partnersHtml =
        event.parceiros && event.parceiros.length
          ? `<div class="event-partners"><span>Parceiros:</span> ${event.parceiros.join(", ")}</div>`
          : ""

      eventCard.innerHTML = `
                <div class="event-image">
                    <img src="${event.imagem || "images/placeholder-event.jpg"}" alt="${event.nome}">
                </div>
                <div class="event-info">
                    <p class="event-date">${formatDate(event.data)}</p>
                    <h3>${event.nome}</h3>
                    <span class="event-type">${event.tipo}</span>
                    <p>${event.descricao}</p>
                    ${flagsHtml}
                    ${partnersHtml}
                </div>
            `

      // Adicionar galeria se existir
      if (event.galeria && event.galeria.length > 0) {
        const eventInfo = eventCard.querySelector(".event-info")
        createGallery(event, eventInfo, "Ver Fotos e Vídeos")
      }

      container.appendChild(eventCard)
    })
  }

  renderEvents()

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()

      const filteredEvents = events.filter(
        (event) =>
          event.nome.toLowerCase().includes(searchTerm) ||
          event.descricao.toLowerCase().includes(searchTerm) ||
          (event.flags && event.flags.some((flag) => flag.toLowerCase().includes(searchTerm))) ||
          (event.parceiros && event.parceiros.some((partner) => partner.toLowerCase().includes(searchTerm))) ||
          event.tipo.toLowerCase().includes(searchTerm),
      )

      renderEvents(filteredEvents)
    })
  }
}

// Função para carregar e exibir programas
async function loadPrograms() {
  const programs = await loadData("data/programas.json")
  const container = document.getElementById("programs-container")
  const searchInput = document.getElementById("programas-search")

  if (!container || !programs.length) return

  function renderPrograms(filteredPrograms = programs) {
    container.innerHTML = ""

    if (filteredPrograms.length === 0) {
      container.innerHTML = '<p class="no-results">Nenhum programa encontrado.</p>'
      return
    }

    filteredPrograms.forEach((program) => {
      const programCard = document.createElement("div")
      programCard.className = "program-card"

      const sponsorsHtml =
        program.patrocinadores && program.patrocinadores.length
          ? `<div class="program-sponsors"><span>Patrocinadores:</span> ${program.patrocinadores.join(", ")}</div>`
          : ""

      programCard.innerHTML = `
                <div class="program-info">
                    <h3>${program.nome}</h3>
                    <p>${program.descricao}</p>
                    <p class="program-dates">Período: ${formatDate(program.data_inicio)} - ${formatDate(program.data_fim)}</p>
                    ${sponsorsHtml}
                </div>
            `

      container.appendChild(programCard)
    })
  }

  renderPrograms()

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()

      const filteredPrograms = programs.filter(
        (program) =>
          program.nome.toLowerCase().includes(searchTerm) ||
          program.descricao.toLowerCase().includes(searchTerm) ||
          (program.patrocinadores &&
            program.patrocinadores.some((sponsor) => sponsor.toLowerCase().includes(searchTerm))),
      )

      renderPrograms(filteredPrograms)
    })
  }
}

// Função para carregar e exibir agenda
async function loadAgenda() {
  const agendaItems = await loadData("data/agenda.json")
  const container = document.getElementById("agenda-container")
  const searchInput = document.getElementById("agenda-search")

  if (!container || !agendaItems.length) return

  function renderAgenda(filteredAgenda = agendaItems) {
    container.innerHTML = ""

    if (filteredAgenda.length === 0) {
      container.innerHTML = '<p class="no-results">Nenhum item de agenda encontrado.</p>'
      return
    }

    filteredAgenda.forEach((item) => {
      const agendaCard = document.createElement("div")
      agendaCard.className = "agenda-card"

      const partnersHtml =
        item.parceiros && item.parceiros.length
          ? `<div class="agenda-partners"><span>Parceiros:</span> ${item.parceiros.join(", ")}</div>`
          : ""

      const registrationHtml = item.inscricao
        ? `<div class="agenda-registration"><a href="${item.inscricao}" target="_blank">Inscrever-se</a></div>`
        : ""

      agendaCard.innerHTML = `
                <div class="agenda-info">
                    <h3>${item.nome}</h3>
                    <span class="agenda-type">${item.tipo}</span>
                    <p>${item.descricao}</p>
                    <p class="agenda-dates">Período: ${formatDate(item.data_inicio)} - ${formatDate(item.data_fim)}</p>
                    ${item.flag ? `<span class="agenda-flag">${item.flag}</span>` : ""}
                    ${partnersHtml}
                    ${registrationHtml}
                </div>
            `

      // Adicionar galeria se existir
      if (item.galeria && item.galeria.length > 0) {
        const agendaInfo = agendaCard.querySelector(".agenda-info")
        createGallery(item, agendaInfo, "Ver Fotos e Vídeos")
      }

      container.appendChild(agendaCard)
    })
  }

  renderAgenda()

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()

      const filteredAgenda = agendaItems.filter(
        (item) =>
          item.nome.toLowerCase().includes(searchTerm) ||
          item.descricao.toLowerCase().includes(searchTerm) ||
          item.tipo.toLowerCase().includes(searchTerm) ||
          (item.flag && item.flag.toLowerCase().includes(searchTerm)) ||
          (item.parceiros && item.parceiros.some((partner) => partner.toLowerCase().includes(searchTerm))),
      )

      renderAgenda(filteredAgenda)
    })
  }
}

// Função para carregar e exibir notícias
async function loadNews() {
  const news = await loadData("data/noticias.json")
  const container = document.getElementById("news-container")
  const searchInput = document.getElementById("noticias-search")

  if (!container || !news.length) return

  function renderNews(filteredNews = news) {
    container.innerHTML = ""

    if (filteredNews.length === 0) {
      container.innerHTML = '<p class="no-results">Nenhuma notícia encontrada.</p>'
      return
    }

    filteredNews.forEach((item) => {
      const newsCard = document.createElement("div")
      newsCard.className = "news-card"

      const formattedDate = formatDate(item.data)

      newsCard.innerHTML = `
        <div class="news-image">
          <img src="${item.imagem}" alt="${item.titulo}">
        </div>
        <div class="news-info">
          <p class="news-date">${formattedDate}</p>
          <h3>${item.titulo}</h3>
          <p>${item.descricao}</p>
          <a href="${item.link}" class="news-link">Ler mais</a>
        </div>
      `

      container.appendChild(newsCard)
    })
  }

  renderNews()

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()

      const filteredNews = news.filter(
        (item) => item.titulo.toLowerCase().includes(searchTerm) || item.descricao.toLowerCase().includes(searchTerm),
      )

      renderNews(filteredNews)
    })
  }
}

// Carregar todos os dados quando a página for carregada
document.addEventListener("DOMContentLoaded", () => {
  loadMembers()
  loadPartners()
  loadEvents()
  loadPrograms()
  loadAgenda()
  loadNews() // Adicionar carregamento de notícias
  createGalleryModal() // Criar o modal da galeria
})

