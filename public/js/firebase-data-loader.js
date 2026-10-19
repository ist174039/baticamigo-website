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

  // Dynamic text is escaped before entering the few static HTML templates
  // below; URLs are separately constrained to web-safe protocols.
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])
  }
  function safeUrl(value) {
    if (typeof value !== "string") return ""
    try {
      const url = new URL(value, window.location.origin)
      return ["http:", "https:"].includes(url.protocol) ? url.href : ""
    } catch { return "" }
  }
  function text(value) { return typeof value === "string" ? value.trim() : "" }
  function searchable(record, fields, term) {
    return fields.some((field) => {
      const value = record?.[field]
      const values = Array.isArray(value) ? value : [value]
      return values.some((entry) => text(entry).toLocaleLowerCase().includes(term))
    })
  }
  function imageElement(url, alt, className) {
    const safe = safeUrl(url)
    if (!safe) return null
    const img = document.createElement("img")
    img.src = safe
    img.alt = text(alt)
    img.loading = "lazy"
    img.decoding = "async"
    if (className) img.className = className
    return img
  }
  function pruneEmptyFields(root) {
    root.querySelectorAll("p, span, a").forEach((node) => {
      if (!node.textContent.trim() && !node.querySelector("img, video, i")) node.remove()
    })
  }
  function finalizeCard(card) {
    pruneEmptyFields(card)
    card.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("src")) img.closest(".member-image, .partner-logo, .event-image, .news-image")?.remove()
    })
  }

  // Função para formatar data
  function formatDate(timestamp) {
    if (!timestamp) return ""

    // Verificar se é um timestamp do Firestore
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      timestamp = timestamp.toDate()
    } else if (typeof timestamp === "string") {
      timestamp = new Date(timestamp)
    }

    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    if (Number.isNaN(date.getTime())) return ""
    const options = { day: "numeric", month: "long", year: "numeric" }
    return date.toLocaleDateString(document.documentElement.lang || "pt-PT", options)
  }

  // Sort public records newest first. Firestore timestamps, Date instances,
  // ISO strings and common seconds/milliseconds fields are accepted. Missing
  // or invalid dates retain their original Firestore order after dated rows.
  function dateValue(value) {
    if (value == null) return null
    if (typeof value.toDate === "function") value = value.toDate()
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime()
    if (typeof value === "number") return value < 1e12 ? value * 1000 : value
    if (typeof value === "string") {
      const parsed = Date.parse(value)
      return Number.isNaN(parsed) ? null : parsed
    }
    if (typeof value === "object") {
      if (typeof value.seconds === "number") return value.seconds * 1000
      if (typeof value._seconds === "number") return value._seconds * 1000
    }
    return null
  }

  function sortNewest(records, fields) {
    return records
      .map((record, index) => ({ record, index, time: fields.map((field) => dateValue(record[field])).find((value) => value != null) }))
      .sort((a, b) => {
        if (a.time == null && b.time != null) return 1
        if (a.time != null && b.time == null) return -1
        if (a.time != null && b.time != null && a.time !== b.time) return b.time - a.time
        return a.index - b.index
      })
      .map(({ record }) => record)
  }

  // Função para carregar e exibir membros
  async function loadMembers() {
    try {
      const membersSnapshot = await db.collection("membros").get()
      const container = document.getElementById("members-container")

      if (!container) return
      const members = []
      membersSnapshot.forEach((doc) => members.push({ ...doc.data(), id: doc.id }))
      // Ignore incomplete Firestore documents. A document with no displayable
      // information must not create a blank card or keep an empty section open.
      const visibleMembers = members.filter((member) => [member.nome, member.cargo, member.descricao, member.imagem].some((value) => text(value)))
      if (!visibleMembers.length) {
        container.innerHTML = '<p class="no-results">Ainda não há membros publicados.</p>'
        setCollectionState("members-container", "empty")
        return
      }

      setCollectionState("members-container", "loaded", visibleMembers.length)

      container.innerHTML = ""

      sortNewest(visibleMembers, ["createdAt", "created_at", "created", "createdOn", "created_on", "data", "data_criacao", "dataCriacao", "updatedAt", "updated_at", "atualizadoAt"]).forEach((member) => {
        const memberCard = document.createElement("div")
        memberCard.className = "member-card"

        memberCard.innerHTML = `
          <div class="member-image">
            <img src="${safeUrl(member.imagem)}" alt="${escapeHtml(member.nome)}">
          </div>
          <div class="member-info">
            <h3>${escapeHtml(member.nome)}</h3>
            <p class="member-position">${escapeHtml(member.cargo)}</p>
            <p>${escapeHtml(member.descricao)}</p>
          </div>
        `

        finalizeCard(memberCard)
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
      const partners = []
      partnersSnapshot.forEach((doc) => partners.push({ ...doc.data(), id: doc.id }))
      // Keep only records that can render useful partner information.
      const visiblePartners = partners.filter((partner) => [partner.nome, partner.logo, partner.descricao, partner.website].some((value) => text(value)))
      if (!visiblePartners.length) {
        container.innerHTML = '<p class="no-results">Ainda não há parceiros publicados.</p>'
        setCollectionState("partners-container", "empty")
        return
      }

      setCollectionState("partners-container", "loaded", visiblePartners.length)

      container.innerHTML = ""

      sortNewest(visiblePartners, ["createdAt", "created_at", "created", "createdOn", "created_on", "data", "data_criacao", "dataCriacao", "updatedAt", "updated_at", "atualizadoAt"]).forEach((partner) => {
        const partnerCard = document.createElement("div")
        partnerCard.className = "partner-card"
        const website = safeUrl(partner.website)

        partnerCard.innerHTML = `
          <div class="partner-logo">
            <img src="${safeUrl(partner.logo)}" alt="${escapeHtml(partner.nome)}">
          </div>
          <div class="partner-info">
            <h3>${escapeHtml(partner.nome)}</h3>
            <p>${escapeHtml(partner.descricao)}</p>
            ${website ? `<a href="${website}" class="partner-website" target="_blank" rel="noopener noreferrer">Visitar parceiro</a>` : ""}
          </div>
        `

        finalizeCard(partnerCard)
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
    let modal = document.getElementById("gallery-modal")
    if (!modal) {
      modal = document.createElement("div")
      modal.id = "gallery-modal"
      modal.className = "gallery-modal"
      modal.innerHTML = `<div class="modal-content"><button type="button" class="modal-close" aria-label="Fechar galeria"><i class="fas fa-times" aria-hidden="true"></i></button><button type="button" class="modal-prev" aria-label="Fotografia anterior"><i class="fas fa-chevron-left" aria-hidden="true"></i></button><button type="button" class="modal-next" aria-label="Fotografia seguinte"><i class="fas fa-chevron-right" aria-hidden="true"></i></button><div class="modal-media-container"></div><p class="modal-caption"></p></div>`
      document.body.appendChild(modal)
    }
    if (modal.dataset.galleryReady === "true") return

    modal.dataset.galleryReady = "true"
    modal.setAttribute("role", "dialog")
    modal.setAttribute("aria-modal", "true")
    modal.setAttribute("aria-label", "Galeria de fotografias")
    modal.setAttribute("aria-hidden", "true")
    modal.tabIndex = -1

    const close = () => {
      if (!modal.classList.contains("active")) return
      const video = modal.querySelector("video")
      if (video) { video.pause(); video.currentTime = 0 }
      modal.classList.remove("active")
      modal.setAttribute("aria-hidden", "true")
      document.body.classList.remove("gallery-open")
      const opener = modal._galleryOpener
      modal._galleryOpener = null
      if (opener && opener.isConnected) opener.focus({ preventScroll: true })
    }
    modal._closeGallery = close
    modal.querySelector(".modal-close")?.addEventListener("click", close)
    modal.addEventListener("click", (event) => { if (event.target === modal) close() })
    document.addEventListener("keydown", (event) => {
      if (!modal.classList.contains("active")) return
      if (event.key === "Escape") { event.preventDefault(); close() }
      if (event.key === "ArrowLeft") modal.querySelector(".modal-prev")?.click()
      if (event.key === "ArrowRight") modal.querySelector(".modal-next")?.click()
    })
  }

  // Função para abrir o modal da galeria
  function openGalleryModal(items, currentIndex) {
    createGalleryModal()
    const modal = document.getElementById("gallery-modal")
    const mediaContainer = modal.querySelector(".modal-media-container")
    const caption = modal.querySelector(".modal-caption")
    const prevBtn = modal.querySelector(".modal-prev")
    const nextBtn = modal.querySelector(".modal-next")

    function showItem(index) {
      const oldVideo = mediaContainer.querySelector("video")
      if (oldVideo) { oldVideo.pause(); oldVideo.currentTime = 0 }
      const item = items[index]
      mediaContainer.innerHTML = ""

      if (item.tipo === "imagem") {
        const img = document.createElement("img")
        img.src = safeUrl(item.url)
        img.alt = text(item.legenda)
        img.className = "modal-image"
        mediaContainer.appendChild(img)
      } else if (item.tipo === "video") {
        const video = document.createElement("video")
        video.src = safeUrl(item.url)
        video.controls = true
        video.autoplay = true
        video.className = "modal-video"
        mediaContainer.appendChild(video)
      }

      caption.textContent = text(item.legenda)
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
    modal._galleryOpener = document.activeElement
    modal.classList.add("active")
    modal.setAttribute("aria-hidden", "false")
    document.body.classList.add("gallery-open")
    modal.querySelector(".modal-close")?.focus({ preventScroll: true })
  }

  // Função para criar galeria para um item
  function createGallery(item, container, title) {
    if (!item.galeria || item.galeria.length === 0) {
      return
    }

    const gallerySection = document.createElement("div")
    gallerySection.className = "gallery"

    const galleryId = `gallery-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10)}`
    const galleryTitle = document.createElement("button")
    galleryTitle.type = "button"
    galleryTitle.className = "gallery-title"
    galleryTitle.setAttribute("aria-expanded", "false")
    galleryTitle.setAttribute("aria-controls", galleryId)
    const icon = document.createElement("i")
    icon.className = "fas fa-chevron-down"
    icon.setAttribute("aria-hidden", "true")
    galleryTitle.append(icon, document.createTextNode(` ${text(title) || "Galeria"}`))

    const galleryContent = document.createElement("div")
    galleryContent.className = "gallery-content"
    galleryContent.id = galleryId
    galleryContent.setAttribute("aria-label", `${text(title) || "Galeria"} — fotografias`)

    item.galeria.forEach((media, index) => {
      const thumbnailUrl = safeUrl(media.tipo === "video" ? media.thumbnail : media.url)
      if (!thumbnailUrl) return
      const galleryItem = document.createElement("button")
      galleryItem.type = "button"
      galleryItem.className = `gallery-item ${media.tipo === "video" ? "video" : ""}`
      galleryItem.setAttribute("aria-label", `Abrir ${media.tipo === "video" ? "vídeo" : "fotografia"}${media.legenda ? `: ${media.legenda}` : ""}`)

      const thumbnail = document.createElement("img")
      thumbnail.src = thumbnailUrl
      thumbnail.alt = text(media.legenda)
      thumbnail.loading = "lazy"
      thumbnail.decoding = "async"

      galleryItem.appendChild(thumbnail)
      galleryContent.appendChild(galleryItem)

      galleryItem.addEventListener("click", () => {
        openGalleryModal(item.galeria, index)
      })
    })

    galleryTitle.addEventListener("click", () => {
      const expanded = galleryTitle.getAttribute("aria-expanded") !== "true"
      galleryTitle.classList.toggle("active", expanded)
      galleryContent.classList.toggle("active", expanded)
      galleryTitle.setAttribute("aria-expanded", String(expanded))
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
      sortNewest(events, ["data", "data_inicio", "data_publicacao", "dataPublicacao", "createdAt", "created_at"])

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
              ? `<div class="event-flags">${event.flags.map((flag) => `<span class="event-flag">${escapeHtml(flag)}</span>`).join("")}</div>`
              : ""

          const partnersHtml =
            event.parceiros && event.parceiros.length
              ? `<div class="event-partners"><span>Parceiros:</span> ${escapeHtml(event.parceiros.join(", "))}</div>`
              : ""

          eventCard.innerHTML = `
            <div class="event-image">
              <img src="${safeUrl(event.imagem)}" alt="${escapeHtml(event.nome)}">
            </div>
            <div class="event-info">
              <p class="event-date">${formatDate(event.data)}</p>
              <h3>${escapeHtml(event.nome)}</h3>
              <span class="event-type">${escapeHtml(event.tipo)}</span>
              <p>${escapeHtml(event.descricao)}</p>
              ${flagsHtml}
              ${partnersHtml}
            </div>
          `

          // Adicionar galeria se existir
          if (event.galeria && event.galeria.length > 0) {
            const eventInfo = eventCard.querySelector(".event-info")
            createGallery(event, eventInfo, "Ver Fotos e Vídeos")
          }

          finalizeCard(eventCard)
          container.appendChild(eventCard)
        })
      }

      renderEvents()

      if (searchInput) {
        searchInput.addEventListener("input", function () {
          const searchTerm = this.value.toLowerCase()

          const filteredEvents = events.filter((event) => searchable(event, ["nome", "descricao", "tipo", "flags", "parceiros"], searchTerm))

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
      sortNewest(programs, ["data_inicio", "data", "data_publicacao", "dataPublicacao", "createdAt", "created_at"])

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
              ? `<div class="program-sponsors"><span>Patrocinadores:</span> ${escapeHtml(program.patrocinadores.join(", "))}</div>`
              : ""

          programCard.innerHTML = `
            <div class="program-info">
              <h3>${escapeHtml(program.nome)}</h3>
              <p>${escapeHtml(program.descricao)}</p>
              <p class="program-dates">Período: ${formatDate(program.data_inicio)} - ${formatDate(program.data_fim)}</p>
              ${sponsorsHtml}
            </div>
          `

          finalizeCard(programCard)
          container.appendChild(programCard)
        })
      }

      renderPrograms()

      if (searchInput) {
        searchInput.addEventListener("input", function () {
          const searchTerm = this.value.toLowerCase()

          const filteredPrograms = programs.filter((program) => searchable(program, ["nome", "descricao", "patrocinadores"], searchTerm))

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
      sortNewest(agendaItems, ["data_inicio", "data", "data_publicacao", "dataPublicacao", "createdAt", "created_at"])

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
              ? `<div class="agenda-partners"><span>Parceiros:</span> ${escapeHtml(item.parceiros.join(", "))}</div>`
              : ""

          const registrationUrl = safeUrl(item.inscricao)
          const registrationHtml = registrationUrl
            ? `<div class="agenda-registration"><a href="${registrationUrl}" target="_blank" rel="noopener noreferrer">Inscrever-se</a></div>`
            : ""

          agendaCard.innerHTML = `
            <div class="agenda-info">
              <h3>${escapeHtml(item.nome)}</h3>
              <span class="agenda-type">${escapeHtml(item.tipo)}</span>
              <p>${escapeHtml(item.descricao)}</p>
              <p class="agenda-dates">Período: ${formatDate(item.data_inicio)} - ${formatDate(item.data_fim)}</p>
              ${item.flag ? `<span class="agenda-flag">${escapeHtml(item.flag)}</span>` : ""}
              ${partnersHtml}
              ${registrationHtml}
            </div>
          `

          // Adicionar galeria se existir
          if (item.galeria && item.galeria.length > 0) {
            const agendaInfo = agendaCard.querySelector(".agenda-info")
            createGallery(item, agendaInfo, "Ver Fotos e Vídeos")
          }

          finalizeCard(agendaCard)
          container.appendChild(agendaCard)
        })
      }

      renderAgenda()

      if (searchInput) {
        searchInput.addEventListener("input", function () {
          const searchTerm = this.value.toLowerCase()

          const filteredAgenda = agendaItems.filter((item) => searchable(item, ["nome", "descricao", "tipo", "flag", "parceiros"], searchTerm))

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
      sortNewest(news, ["data", "data_publicacao", "dataPublicacao", "createdAt", "created_at", "updatedAt", "updated_at"])

      setCollectionState("news-container", news.length ? "loaded" : "empty", news.length)

      container.innerHTML = ""

      if (news.length === 0) {
        container.innerHTML = '<p class="no-results">Nenhuma notícia encontrada.</p>'
        return
      }

      news.forEach((item) => {
        const newsCard = document.createElement("div")
        newsCard.className = "news-card"
        const articleUrl = safeUrl(item.link)

        newsCard.innerHTML = `
          <div class="news-image">
            <img src="${safeUrl(item.imagem)}" alt="${escapeHtml(item.titulo)}">
          </div>
          <div class="news-info">
            <p class="news-date">${formatDate(item.data)}</p>
            <h3>${escapeHtml(item.titulo)}</h3>
            <p>${escapeHtml(item.descricao)}</p>
            ${articleUrl ? `<a href="${articleUrl}" class="news-link" target="_blank" rel="noopener noreferrer">Ler mais</a>` : ""}
          </div>
        `

        finalizeCard(newsCard)
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

