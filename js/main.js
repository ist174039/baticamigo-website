document.addEventListener("DOMContentLoaded", () => {
  // Menu mobile
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
  const navMenu = document.querySelector(".nav-menu")

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      navMenu.classList.toggle("active")
      mobileMenuBtn.classList.toggle("active")
    })
  }

  // Fechar menu ao clicar em um link
  const navLinks = document.querySelectorAll(".nav-menu a")
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active")
      mobileMenuBtn.classList.remove("active")
    })
  })

  // Função para rolagem suave
  function smoothScroll(targetId) {
    const targetElement = document.querySelector(targetId)

    if (targetElement) {
      console.log("Elemento alvo encontrado:", targetId)
      const headerHeight = document.querySelector("#header").offsetHeight
      const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      })
    } else {
      console.log("Elemento alvo NÃO encontrado:", targetId)
    }
  }

  // Aplicar rolagem suave a todos os links internos
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      console.log("Link clicado:", targetId)
      smoothScroll(targetId)
    })
  })

  // Tratamento específico para o botão "Entre em Contato"
  const contactButton = document.querySelector('.hero-content a[href="#contato"]')
  if (contactButton) {
    console.log("Botão 'Entre em Contato' encontrado")
    contactButton.addEventListener("click", (e) => {
      e.preventDefault()
      console.log("Botão 'Entre em Contato' clicado")
      smoothScroll("#contato")
    })
  } else {
    console.log("Botão 'Entre em Contato' NÃO encontrado")
  }

  // Tratamento de vídeos na galeria
  document.addEventListener("click", (e) => {
    const videoItem = e.target.closest(".gallery-item.video")
    if (videoItem) {
      const modal = document.getElementById("gallery-modal")
      const videoContainer = modal.querySelector("video")

      if (videoContainer) {
        videoContainer.addEventListener("ended", function () {
          // Reiniciar vídeo ao terminar
          this.currentTime = 0
        })
      }
    }
  })

  // Navegação por teclado para o modal da galeria
  document.addEventListener("keydown", (e) => {
    const modal = document.getElementById("gallery-modal")
    if (!modal || !modal.classList.contains("active")) return

    if (e.key === "ArrowLeft") {
      modal.querySelector(".modal-prev").click()
    } else if (e.key === "ArrowRight") {
      modal.querySelector(".modal-next").click()
    }
  })
})

