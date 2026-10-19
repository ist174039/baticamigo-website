// Script para carregar dados do Firebase
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Carregando dados do Firebase...")

  // Hide only collections that successfully loaded with zero records. A failed
  // request stays visible so visitors can distinguish an error from no content.
  function setCollectionState(containerId, state, count = 0) {
    const container = document.getElementById(containerId)
    if (!container) return

    container.dataset.collectionState = state
    const isEmpty = state === "empty" && count === 0
    const section = container.closest("section")

    if (containerId === "members-container" || containerId === "partners-container") {
      const panel = container.closest(".people-panel")
      if (panel) panel.hidden = isEmpty

      const community = document.getElementById("membros")
      if (community) {
        const panels = community.querySelectorAll(".people-panel")
        community.hidden = panels.length > 0 && [...panels].every((item) => item.hidden)
      }
      return
    }

    if (section) section.hidden = isEmpty
  }

  // Keep sections visible when Firebase fails to initialize; that is an error,
  // not an empty collection.
  const collectionIds = ["events-container", "programs-container", "agenda-container", "members-container", "partners-container", "news-container"]
  collectionIds.forEach((id) => setCollectionState(id, "loading"))
  if (typeof firebase === "undefined") {
    collectionIds.forEach((id) => setCollectionState(id, "error"))
    console.error("Firebase não está inicializado. Verifique se os scripts do Firebase foram carregados.")
    return
  }

  // Referência ao Firestore
  const db = firebase.firestore()

  // Função para formatar data
  function formatDate(timestamp) {
    if (!timestamp) return ""

    // Verificar se é um timestamp do Firestore
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      timestamp = timestamp.toDate()
    } else if (typeof timestamp === "string") {
      timestamp = new Date(timestamp)
    }

    const options = { day: "numeric", month: "long", year: "numeric" }
    return timestamp.toLocaleDateString(document.documentElement.lang || "pt-BR", options)
  }

  // Função para carregar e exibir membros
  async function loadMembers() {
    try {
      const membersSnapshot = await db.collection("membros").get()
      const container = document.getElementById("members-container")

      if (!container) return
      if (membersSnapshot.empty) {
        container.innerHTML = '<p class="no-results">Ainda não há membros publicados.</p>'
        setCollectionState("members-container", "empty")
        return
      }

      setCollectionState("members-container", "loaded", membersSnapshot.size)

      container.innerHTML = ""

      membersSnapshot.forEach((doc) => {
        const member = doc.data()
        const memberCard = document.createElement("div")
        memberCard.className = "member-card"

        memberCard.innerHTML = `
          <div class="member-image">
            <img src="${member.imagem || "https://firebasestorage.googleapis.com/v0/b/baticamigo-c0384.firebasestorage.app/o/logo.png?alt=media&token=77f706ee-7d07-4465-a37d-e463b03c97b7"}" alt="${member.nome}">
          </div>
          <div class="member-info">
            <h3>${member.nome}</h3>
            <p class="member-position">${member.cargo}</p>
            <p>${member.descricao}</p>
          </div>
        `

        container.appendChild(memberCard)
      })

      console.log(`${membersSnapshot.size} membros carregados`)
    } catch (error) {
      const container = document.getElementById("members-container");
      setCollectionState("members-container", "error");
      if (container) container.innerHTML = '<p class="no-results">Não foi possível carregar os membros. Atualize a página para tentar novamente.</p>';
      console.error("Erro ao carregar membros:", error)
    }
  }

  // Função para carregar e exibir parceiros
  async function loadPartners() {
    try {
      const partnersSnapshot = await db.collection("parceiros").get()
      const container = document.getElementById("partners-container")

      if (!container) return
      if (partnersSnapshot.empty) {
        container.innerHTML = '<p class="no-results">Ainda não há parceiros publicados.</p>'
        setCollectionState("partners-container", "empty")
        return
      }

      setCollectionState("partners-container", "loaded", partnersSnapshot.size)

      container.innerHTML = ""

      partnersSnapshot.forEach((doc) => {
        const partner = doc.data()
        const partnerCard = document.createElement("div")
        partnerCard.className = "partner-card"

        partnerCard.innerHTML = `
          <div class="partner-logo">
            <img src="${partner.logo || "https://firebasestorage.googleapis.com/v0/b/baticamigo-c0384.firebasestorage.app/o/logo.png?alt=media&token=77f706ee-7d07-4465-a37d-e463b03c97b7"}" alt="${partner.nome}">
          </div>
          <div class="partner-info">
            <h3>${partner.nome}</h3>
            <p>${partner.descricao}</p>
            ${partner.website ? `<a href="${partner.website}" class="partner-website" target="_blank">Website</a>` : ""}
          </div>
        `

        container.appendChild(partnerCard)
      })

      console.log(`${partnersSnapshot.size} parceiros carregados`)
    } catch (error) {
      const container = document.getElementById("partners-container");
      setCollectionState("partners-container", "error");
      if (container) container.innerHTML = '<p class="no-results">Não foi possível carregar os parceiros. Atualize a página para tentar novamente.</p>';
      console.error("Erro ao carregar parceiros:", error)
    }
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

    const galleryId = `gallery-${Math.random().toString(36).slice(2, 10)}`
    const galleryTitle = document.createElement("button")
    galleryTitle.type = "button"
    galleryTitle.className = "gallery-title"
    galleryTitle.setAttribute("aria-expanded", "false")
    galleryTitle.setAttribute("aria-controls", galleryId)
    galleryTitle.innerHTML = `<i class="fas fa-chevron-down" aria-hidden="true"></i> ${title || "Galeria"}`

    const galleryContent = document.createElement("div")
    galleryContent.className = "gallery-content"
    galleryContent.id = galleryId

    item.galeria.forEach((media, index) => {
      const galleryItem = document.createElement("button")
      galleryItem.type = "button"
      galleryItem.className = `gallery-item ${media.tipo === "video" ? "video" : ""}`
      galleryItem.setAttribute("aria-label", `Abrir ${media.tipo === "video" ? "vídeo" : "fotografia"}${media.legenda ? `: ${media.legenda}` : ""}`)

      const thumbnail = document.createElement("img")
      thumbnail.src = media.tipo === "video" ? media.thumbnail : media.url
      thumbnail.alt = media.legenda || ""
      thumbnail.loading = "lazy"

      galleryItem.appendChild(thumbnail)
      galleryContent.appendChild(galleryItem)

      galleryItem.addEventListener("click", () => {
        openGalleryModal(item.galeria, index)
      })
    })

    galleryTitle.addEventListener("click", () => {
      galleryTitle.classList.toggle("active")
      galleryContent.classList.toggle("active")
      galleryTitle.setAttribute("aria-expanded", String(galleryContent.classList.contains("active")))
    })

    gallerySection.appendChild(galleryTitle)
    gallerySection.appendChild(galleryContent)
    container.appendChild(gallerySection)
  }

  // Função para carregar e exibir eventos
  async function loadEvents() {
    try {
      const eventsSnapshot = await db.collection("eventos").get()
      const container = document.getElementById("events-container")
      const searchInput = document.getElementById("eventos-search")

      if (!container) {
        console.log("Container de eventos não encontrado")
        return
      }

      const events = []
      eventsSnapshot.forEach((doc) => {
        events.push({ ...doc.data(), id: doc.id })
      })

      setCollectionState("events-container", events.length ? "loaded" : "empty", events.length)

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
              <img src="${event.imagem || "https://firebasestorage.googleapis.com/v0/b/baticamigo-c0384.firebasestorage.app/o/logo.png?alt=media&token=77f706ee-7d07-4465-a37d-e463b03c97b7"}" alt="${event.nome}">
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

      console.log(`${events.length} eventos carregados`)
    } catch (error) {
      const container = document.getElementById("events-container");
      setCollectionState("events-container", "error");
      if (container) container.innerHTML = '<p class="no-results">Não foi possível carregar os eventos. Atualize a página para tentar novamente.</p>';
      console.error("Erro ao carregar eventos:", error)
    }
  }

  // Função para carregar e exibir programas
  async function loadPrograms() {
    try {
      const programsSnapshot = await db.collection("programas").get()
      const container = document.getElementById("programs-container")
      const searchInput = document.getElementById("programas-search")

      if (!container) {
        console.log("Container de programas não encontrado")
        return
      }

      const programs = []
      programsSnapshot.forEach((doc) => {
        programs.push({ ...doc.data(), id: doc.id })
      })

      setCollectionState("programs-container", programs.length ? "loaded" : "empty", programs.length)

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

      console.log(`${programs.length} programas carregados`)
    } catch (error) {
      const container = document.getElementById("programs-container");
      setCollectionState("programs-container", "error");
      if (container) container.innerHTML = '<p class="no-results">Não foi possível carregar os programas. Atualize a página para tentar novamente.</p>';
      console.error("Erro ao carregar programas:", error)
    }
  }

  // Função para carregar e exibir agenda
  async function loadAgenda() {
    try {
      const agendaSnapshot = await db.collection("agenda").get()
      const container = document.getElementById("agenda-container")
      const searchInput = document.getElementById("agenda-search")

      if (!container) {
        console.log("Container de agenda não encontrado")
        return
      }

      const agendaItems = []
      agendaSnapshot.forEach((doc) => {
        agendaItems.push({ ...doc.data(), id: doc.id })
      })

      setCollectionState("agenda-container", agendaItems.length ? "loaded" : "empty", agendaItems.length)

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

      console.log(`${agendaItems.length} itens de agenda carregados`)
    } catch (error) {
      const container = document.getElementById("agenda-container");
      setCollectionState("agenda-container", "error");
      if (container) container.innerHTML = '<p class="no-results">Não foi possível carregar a agenda. Atualize a página para tentar novamente.</p>';
      console.error("Erro ao carregar agenda:", error)
    }
  }

  // Função para carregar e exibir notícias
  async function loadNews() {
    try {
      const newsSnapshot = await db.collection("noticias").get()
      const container = document.getElementById("news-container")

      if (!container) {
        console.log("Container de notícias não encontrado")
        return
      }

      const news = []
      newsSnapshot.forEach((doc) => {
        news.push({ ...doc.data(), id: doc.id })
      })

      setCollectionState("news-container", news.length ? "loaded" : "empty", news.length)

      container.innerHTML = ""

      if (news.length === 0) {
        container.innerHTML = '<p class="no-results">Nenhuma notícia encontrada.</p>'
        return
      }

      news.forEach((item) => {
        const newsCard = document.createElement("div")
        newsCard.className = "news-card"

        newsCard.innerHTML = `
          <div class="news-image">
            <img src="${item.imagem || "https://firebasestorage.googleapis.com/v0/b/baticamigo-c0384.firebasestorage.app/o/logo.png?alt=media&token=77f706ee-7d07-4465-a37d-e463b03c97b7"}" alt="${item.titulo}">
          </div>
          <div class="news-info">
            <p class="news-date">${formatDate(item.data)}</p>
            <h3>${item.titulo}</h3>
            <p>${item.descricao}</p>
            <a href="${item.link || "#noticias"}" class="news-link">Ler mais</a>
          </div>
        `

        container.appendChild(newsCard)
      })

      console.log(`${news.length} notícias carregadas`)
    } catch (error) {
      const container = document.getElementById("news-container");
      setCollectionState("news-container", "error");
      if (container) container.innerHTML = '<p class="no-results">Não foi possível carregar as notícias. Atualize a página para tentar novamente.</p>';
      console.error("Erro ao carregar notícias:", error)
    }
  }

  // Carregar dados do Firebase
  try {
    createGalleryModal()
    await loadMembers()
    await loadPartners()
    await loadEvents()
    await loadPrograms()
    await loadAgenda()
    await loadNews()
    console.log("Todos os dados foram carregados com sucesso")
  } catch (error) {
    console.error("Erro ao carregar dados:", error)
  }
})

