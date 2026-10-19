import { auth, db, storage, } from './firebaseConfig.js';
document.addEventListener("DOMContentLoaded", () => {
  // Atualizar a importação no topo do arquivo
  

  // Initialize Firebase Authentication, Firestore, and Storage
  // const auth = firebase.auth() // Removed redeclaration
  // const db = firebase.firestore() // Removed redeclaration
  // const storage = firebase.storage() // Removed redeclaration

  // Verificar autenticação
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Usuário autenticado
      document.getElementById("user-email").textContent = user.email
      loadData()
    } else {
      // Redirecionar para a página de login se não estiver autenticado
      window.location.href = "/admin/login"
    }
  })

  // Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      await auth.signOut()
      window.location.href = "/admin/login"
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      alert("Erro ao fazer logout. Tente novamente.")
    }
  })

  // Navegação entre seções
  const sidebarLinks = document.querySelectorAll(".admin-sidebar-menu a")
  const sections = document.querySelectorAll(".admin-section")
  const sectionTitle = document.getElementById("section-title")

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      // Remover classe active de todos os links
      sidebarLinks.forEach((l) => l.classList.remove("active"))

      // Adicionar classe active ao link clicado
      link.classList.add("active")

      // Obter a seção correspondente
      const sectionId = link.getAttribute("data-section")

      // Atualizar título da seção
      sectionTitle.textContent = link.textContent.trim()

      // Esconder todas as seções
      sections.forEach((section) => section.classList.remove("active"))

      // Mostrar a seção correspondente
      document.getElementById(`${sectionId}-section`).classList.add("active")
    })
  })

  // Navegação entre tabs nos modais
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      // Obter o container pai
      const tabsContainer = tab.closest(".admin-tabs")
      const tabContents = tabsContainer.parentElement.querySelectorAll(".admin-tab-content")

      // Remover classe active de todas as tabs e conteúdos
      tabsContainer.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"))
      tabContents.forEach((c) => c.classList.remove("active"))

      // Adicionar classe active à tab clicada
      tab.classList.add("active")

      // Mostrar o conteúdo correspondente
      const tabId = tab.getAttribute("data-tab")
      document.getElementById(tabId).classList.add("active")
    })
  })

  // Funções para abrir/fechar modais
  function openModal(modalId) {
    document.getElementById(modalId).classList.add("active")
  }

  function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active")
  }

  // Fechar modais ao clicar no botão de fechar
  document.querySelectorAll(".admin-modal-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".admin-modal")
      modal.classList.remove("active")
    })
  })

  // Fechar modais ao clicar fora do conteúdo
  document.querySelectorAll(".admin-modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active")
      }
    })
  })

  // Botões para abrir modais de adição
  document.getElementById("add-evento-btn").addEventListener("click", () => {
    document.getElementById("evento-form").reset()
    document.getElementById("evento-id").value = ""
    document.getElementById("evento-modal-title").textContent = "Adicionar Evento"
    clearFilePreview("evento-imagem-preview")
    clearFilePreview("evento-galeria-imagens-preview")
    clearFilePreview("evento-galeria-videos-preview")
    openModal("evento-modal")
  })

  document.getElementById("add-programa-btn").addEventListener("click", () => {
    document.getElementById("programa-form").reset()
    document.getElementById("programa-id").value = ""
    document.getElementById("programa-modal-title").textContent = "Adicionar Programa"
    openModal("programa-modal")
  })

  document.getElementById("add-agenda-btn").addEventListener("click", () => {
    document.getElementById("agenda-form").reset()
    document.getElementById("agenda-id").value = ""
    document.getElementById("agenda-modal-title").textContent = "Adicionar Item de Agenda"
    clearFilePreview("agenda-galeria-imagens-preview")
    clearFilePreview("agenda-galeria-videos-preview")
    openModal("agenda-modal")
  })

  document.getElementById("add-noticia-btn").addEventListener("click", () => {
    document.getElementById("noticia-form").reset()
    document.getElementById("noticia-id").value = ""
    document.getElementById("noticia-modal-title").textContent = "Adicionar Notícia"
    clearFilePreview("noticia-imagem-preview")
    openModal("noticia-modal")
  })

  document.getElementById("add-membro-btn").addEventListener("click", () => {
    document.getElementById("membro-form").reset()
    document.getElementById("membro-id").value = ""
    document.getElementById("membro-modal-title").textContent = "Adicionar Membro"
    clearFilePreview("membro-imagem-preview")
    openModal("membro-modal")
  })

  document.getElementById("add-parceiro-btn").addEventListener("click", () => {
    document.getElementById("parceiro-form").reset()
    document.getElementById("parceiro-id").value = ""
    document.getElementById("parceiro-modal-title").textContent = "Adicionar Parceiro"
    clearFilePreview("parceiro-logo-preview")
    openModal("parceiro-modal")
  })

  // Função para limpar previews de arquivos
  function clearFilePreview(previewId) {
    const previewContainer = document.getElementById(previewId)
    if (previewContainer) {
      previewContainer.innerHTML = ""
    }
  }

  // Função para carregar dados do Firestore
  async function loadData() {
    const collections = [
      ["eventos", renderEventos],
      ["programas", renderProgramas],
      ["agenda", renderAgenda],
      ["noticias", renderNoticias],
      ["membros", renderMembros],
      ["parceiros", renderParceiros],
    ]
    const results = await Promise.allSettled(collections.map(([name]) => db.collection(name).get()))
    const failed = []

    results.forEach((result, index) => {
      const [name, render] = collections[index]
      if (result.status === "fulfilled") {
        render(result.value.docs)
        return
      }
      failed.push(name)
      console.error(`Erro ao carregar ${name}:`, result.reason)
    })

    const errorBox = document.getElementById("admin-init-error")
    if (errorBox) {
      if (failed.length) {
        const reason = results.find((result) => result.status === "rejected")?.reason
        const permissionDenied = reason?.code === "permission-denied"
        errorBox.textContent = permissionDenied
          ? `Sem permissão para ler ${failed.join(", ")}. Verifique as regras de acesso do Firestore para a conta autenticada.`
          : `Não foi possível carregar ${failed.join(", ")}. Tente novamente; as outras listas continuam disponíveis.`
        errorBox.hidden = false
      } else {
        errorBox.hidden = true
      }
    }
  }

  // Funções para renderizar dados nas tabelas
  function renderEventos(eventos) {
    const tableBody = document.getElementById("eventos-table-body");
    tableBody.innerHTML = "";

    eventos.forEach((doc) => {
      const evento = doc.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${evento.nome}</td>
        <td>${evento.tipo}</td>
        <td>${formatDate(evento.data)}</td>
        <td>${evento.destaque ? "Sim" : "Não"}</td>
        <td class="admin-table-actions">
          <button class="edit-btn" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
          <button class="delete-btn" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
        </td>
      `;

      // Adicionar event listeners para os botões de editar e excluir
      row.querySelector(".edit-btn").addEventListener("click", () => editEvento(doc.id));
      row.querySelector(".delete-btn").addEventListener("click", () => deleteEvento(doc.id));

      tableBody.appendChild(row);
    });
  }

  function renderProgramas(programas) {
    const tableBody = document.getElementById("programas-table-body")
    tableBody.innerHTML = ""

    programas.forEach((doc) => {
      const programa = doc.data()
      const row = document.createElement("tr")

      row.innerHTML = `
                <td>${programa.nome}</td>
                <td>${formatDate(programa.data_inicio)} - ${formatDate(programa.data_fim)}</td>
                <td>${programa.patrocinadores ? programa.patrocinadores.join(", ") : ""}</td>
                <td class="admin-table-actions">
                    <button class="edit-btn" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `

      // Adicionar event listeners para os botões de editar e excluir
      row.querySelector(".edit-btn").addEventListener("click", () => editPrograma(doc.id))
      row.querySelector(".delete-btn").addEventListener("click", () => deletePrograma(doc.id))

      tableBody.appendChild(row)
    })
  }

  function renderAgenda(agendaItems) {
    const tableBody = document.getElementById("agenda-table-body");
    tableBody.innerHTML = "";

    agendaItems.forEach((doc) => {
      const item = doc.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${item.nome}</td>
        <td>${item.tipo}</td>
        <td>${formatDate(item.data_inicio)} - ${formatDate(item.data_fim)}</td>
        <td>${item.destaque ? "Sim" : "Não"}</td>
        <td class="admin-table-actions">
          <button class="edit-btn" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
          <button class="delete-btn" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
        </td>
      `;

      // Adicionar event listeners para os botões de editar e excluir
      row.querySelector(".edit-btn").addEventListener("click", () => editAgenda(doc.id));
      row.querySelector(".delete-btn").addEventListener("click", () => deleteAgenda(doc.id));

      tableBody.appendChild(row);
    });
  }

  function renderNoticias(noticias) {
    const tableBody = document.getElementById("noticias-table-body")
    tableBody.innerHTML = ""

    noticias.forEach((doc) => {
      const noticia = doc.data()
      const row = document.createElement("tr")

      row.innerHTML = `
                <td>${noticia.titulo}</td>
                <td>${formatDate(noticia.data)}</td>
                <td>${noticia.destaque ? "Sim" : "Não"}</td>
                <td class="admin-table-actions">
                    <button class="edit-btn" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `

      // Adicionar event listeners para os botões de editar e excluir
      row.querySelector(".edit-btn").addEventListener("click", () => editNoticia(doc.id))
      row.querySelector(".delete-btn").addEventListener("click", () => deleteNoticia(doc.id))

      tableBody.appendChild(row)
    })
  }

  function renderMembros(membros) {
    const tableBody = document.getElementById("membros-table-body")
    tableBody.innerHTML = ""

    membros.forEach((doc) => {
      const membro = doc.data()
      const row = document.createElement("tr")

      row.innerHTML = `
                <td>${membro.nome}</td>
                <td>${membro.cargo}</td>
                <td class="admin-table-actions">
                    <button class="edit-btn" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `

      // Adicionar event listeners para os botões de editar e excluir
      row.querySelector(".edit-btn").addEventListener("click", () => editMembro(doc.id))
      row.querySelector(".delete-btn").addEventListener("click", () => deleteMembro(doc.id))

      tableBody.appendChild(row)
    })
  }

  function renderParceiros(parceiros) {
    const tableBody = document.getElementById("parceiros-table-body")
    tableBody.innerHTML = ""

    parceiros.forEach((doc) => {
      const parceiro = doc.data()
      const row = document.createElement("tr")

      row.innerHTML = `
                <td>${parceiro.nome}</td>
                <td>${parceiro.website || "-"}</td>
                <td class="admin-table-actions">
                    <button class="edit-btn" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `

      // Adicionar event listeners para os botões de editar e excluir
      row.querySelector(".edit-btn").addEventListener("click", () => editParceiro(doc.id))
      row.querySelector(".delete-btn").addEventListener("click", () => deleteParceiro(doc.id))

      tableBody.appendChild(row)
    })
  }



  // Funções para editar registros
  async function editEvento(id) {
    try {
      const doc = await db.collection("eventos").doc(id).get()
      if (!doc.exists) {
        alert("Evento não encontrado!")
        return
      }

      const evento = doc.data()

      // Preencher o formulário com os dados do evento
      document.getElementById("evento-id").value = id
      document.getElementById("evento-nome").value = evento.nome
      document.getElementById("evento-tipo").value = evento.tipo
      document.getElementById("evento-data").value = formatDateForInput(evento.data)
      document.getElementById("evento-descricao").value = evento.descricao
      document.getElementById("evento-parceiros").value = evento.parceiros ? evento.parceiros.join(", ") : ""
      document.getElementById("evento-flags").value = evento.flags ? evento.flags.join(", ") : ""
      document.getElementById("evento-destaque").checked = evento.destaque || false

      // Mostrar imagem atual
      if (evento.imagem) {
        const previewContainer = document.getElementById("evento-imagem-preview")
        previewContainer.innerHTML = `
          <div class="admin-file-preview-item">
            <img src="${evento.imagem}" alt="Imagem do evento">
            <button type="button" class="remove-btn" data-field="imagem"><i class="fas fa-times"></i></button>
          </div>
        `

        // Adicionar event listener para o botão de remover
        previewContainer.querySelector(".remove-btn").addEventListener("click", () => {
          previewContainer.innerHTML = ""
        })
      }

      // Mostrar galeria de imagens
      const imagensPreviewContainer = document.getElementById("evento-galeria-imagens-preview")
      imagensPreviewContainer.innerHTML = ""
      if (evento.galeria) {
        evento.galeria
          .filter((item) => item.tipo === "imagem")
          .forEach((imagem) => {
            const previewItem = document.createElement("div")
            previewItem.className = "admin-file-preview-item"
            previewItem.innerHTML = `
              <img src="${imagem.url}" alt="Imagem da galeria">
              <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
            `
            imagensPreviewContainer.appendChild(previewItem)

            // Adicionar event listener para o botão de remover
            previewItem.querySelector(".remove-btn").addEventListener("click", () => {
              previewItem.remove()
            })
          })
      }

      // Mostrar galeria de vídeos
      const videosPreviewContainer = document.getElementById("evento-galeria-videos-preview")
      videosPreviewContainer.innerHTML = ""
      if (evento.galeria) {
        evento.galeria
          .filter((item) => item.tipo === "video")
          .forEach((video) => {
            const previewItem = document.createElement("div")
            previewItem.className = "admin-file-preview-item"
            previewItem.innerHTML = `
              <video src="${video.url}" controls></video>
              <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
            `
            videosPreviewContainer.appendChild(previewItem)

            // Adicionar event listener para o botão de remover
            previewItem.querySelector(".remove-btn").addEventListener("click", () => {
              previewItem.remove()
            })
          })
      }

      // Atualizar título do modal
      document.getElementById("evento-modal-title").textContent = "Editar Evento"

      // Abrir o modal
      openModal("evento-modal")
    } catch (error) {
      console.error("Erro ao carregar evento:", error)
      alert("Erro ao carregar dados do evento. Tente novamente.")
    }
  }

  async function editPrograma(id) {
    try {
      const doc = await db.collection("programas").doc(id).get()
      if (!doc.exists) {
        alert("Programa não encontrado!")
        return
      }

      const programa = doc.data()

      // Preencher o formulário com os dados do programa
      document.getElementById("programa-id").value = id
      document.getElementById("programa-nome").value = programa.nome
      document.getElementById("programa-descricao").value = programa.descricao
      document.getElementById("programa-data-inicio").value = formatDateForInput(programa.data_inicio)
      document.getElementById("programa-data-fim").value = formatDateForInput(programa.data_fim)
      document.getElementById("programa-patrocinadores").value = programa.patrocinadores
        ? programa.patrocinadores.join(", ")
        : ""

      // Atualizar título do modal
      document.getElementById("programa-modal-title").textContent = "Editar Programa"

      // Abrir o modal
      openModal("programa-modal")
    } catch (error) {
      console.error("Erro ao carregar programa:", error)
      alert("Erro ao carregar dados do programa. Tente novamente.")
    }
  }

  async function editAgenda(id) {
    try {
      const doc = await db.collection("agenda").doc(id).get()
      if (!doc.exists) {
        alert("Item de agenda não encontrado!")
        return
      }

      const agenda = doc.data()

      // Preencher o formulário com os dados do item de agenda
      document.getElementById("agenda-id").value = id
      document.getElementById("agenda-nome").value = agenda.nome
      document.getElementById("agenda-tipo").value = agenda.tipo
      document.getElementById("agenda-flag").value = agenda.flag || ""
      document.getElementById("agenda-descricao").value = agenda.descricao
      document.getElementById("agenda-data-inicio").value = formatDateForInput(agenda.data_inicio)
      document.getElementById("agenda-data-fim").value = formatDateForInput(agenda.data_fim)
      document.getElementById("agenda-parceiros").value = agenda.parceiros ? agenda.parceiros.join(", ") : ""
      document.getElementById("agenda-inscricao").value = agenda.inscricao || ""
      document.getElementById("agenda-destaque").checked = agenda.destaque || false

      // Mostrar galeria de imagens
      const imagensPreviewContainer = document.getElementById("agenda-galeria-imagens-preview")
      imagensPreviewContainer.innerHTML = ""
      if (agenda.galeria) {
        agenda.galeria
          .filter((item) => item.tipo === "imagem")
          .forEach((imagem) => {
            const previewItem = document.createElement("div")
            previewItem.className = "admin-file-preview-item"
            previewItem.innerHTML = `
              <img src="${imagem.url}" alt="Imagem da galeria">
              <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
            `
            imagensPreviewContainer.appendChild(previewItem)

            // Adicionar event listener para o botão de remover
            previewItem.querySelector(".remove-btn").addEventListener("click", () => {
              previewItem.remove()
            })
          })
      }

      // Mostrar galeria de vídeos
      const videosPreviewContainer = document.getElementById("agenda-galeria-videos-preview")
      videosPreviewContainer.innerHTML = ""
      if (agenda.galeria) {
        agenda.galeria
          .filter((item) => item.tipo === "video")
          .forEach((video) => {
            const previewItem = document.createElement("div")
            previewItem.className = "admin-file-preview-item"
            previewItem.innerHTML = `
              <video src="${video.url}" controls></video>
              <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
            `
            videosPreviewContainer.appendChild(previewItem)

            // Adicionar event listener para o botão de remover
            previewItem.querySelector(".remove-btn").addEventListener("click", () => {
              previewItem.remove()
            })
          })
      }

      // Atualizar título do modal
      document.getElementById("agenda-modal-title").textContent = "Editar Item de Agenda"

      // Abrir o modal
      openModal("agenda-modal")
    } catch (error) {
      console.error("Erro ao carregar item de agenda:", error)
      alert("Erro ao carregar dados do item de agenda. Tente novamente.")
    }
  }

  async function editNoticia(id) {
    try {
      const doc = await db.collection("noticias").doc(id).get()
      if (!doc.exists) {
        alert("Notícia não encontrada!")
        return
      }

      const noticia = doc.data()

      // Preencher o formulário com os dados da notícia
      document.getElementById("noticia-id").value = id
      document.getElementById("noticia-titulo").value = noticia.titulo
      document.getElementById("noticia-data").value = formatDateForInput(noticia.data)
      document.getElementById("noticia-descricao").value = noticia.descricao
      document.getElementById("noticia-link").value = noticia.link || "#noticias"
      document.getElementById("noticia-destaque").checked = noticia.destaque || false

      // Mostrar imagem atual
      if (noticia.imagem) {
        const previewContainer = document.getElementById("noticia-imagem-preview")
        previewContainer.innerHTML = `
                    <div class="admin-file-preview-item">
                        <img src="${noticia.imagem}" alt="Imagem da notícia">
                        <button type="button" class="remove-btn" data-field="imagem"><i class="fas fa-times"></i></button>
                    </div>
                `

        // Adicionar event listener para o botão de remover
        previewContainer.querySelector(".remove-btn").addEventListener("click", () => {
          previewContainer.innerHTML = ""
        })
      }

      // Atualizar título do modal
      document.getElementById("noticia-modal-title").textContent = "Editar Notícia"

      // Abrir o modal
      openModal("noticia-modal")
    } catch (error) {
      console.error("Erro ao carregar notícia:", error)
      alert("Erro ao carregar dados da notícia. Tente novamente.")
    }
  }

  async function editMembro(id) {
    try {
      const doc = await db.collection("membros").doc(id).get()
      if (!doc.exists) {
        alert("Membro não encontrado!")
        return
      }

      const membro = doc.data()

      // Preencher o formulário com os dados do membro
      document.getElementById("membro-id").value = id
      document.getElementById("membro-nome").value = membro.nome
      document.getElementById("membro-cargo").value = membro.cargo
      document.getElementById("membro-descricao").value = membro.descricao

      // Mostrar imagem atual
      if (membro.imagem) {
        const previewContainer = document.getElementById("membro-imagem-preview")
        previewContainer.innerHTML = `
                    <div class="admin-file-preview-item">
                        <img src="${membro.imagem}" alt="Foto do membro">
                        <button type="button" class="remove-btn" data-field="imagem"><i class="fas fa-times"></i></button>
                    </div>
                `

        // Adicionar event listener para o botão de remover
        previewContainer.querySelector(".remove-btn").addEventListener("click", () => {
          previewContainer.innerHTML = ""
        })
      }

      // Atualizar título do modal
      document.getElementById("membro-modal-title").textContent = "Editar Membro"

      // Abrir o modal
      openModal("membro-modal")
    } catch (error) {
      console.error("Erro ao carregar membro:", error)
      alert("Erro ao carregar dados do membro. Tente novamente.")
    }
  }

  async function editParceiro(id) {
    try {
      const doc = await db.collection("parceiros").doc(id).get()
      if (!doc.exists) {
        alert("Parceiro não encontrado!")
        return
      }

      const parceiro = doc.data()

      // Preencher o formulário com os dados do parceiro
      document.getElementById("parceiro-id").value = id
      document.getElementById("parceiro-nome").value = parceiro.nome
      document.getElementById("parceiro-descricao").value = parceiro.descricao
      document.getElementById("parceiro-website").value = parceiro.website || ""

      // Mostrar logo atual
      if (parceiro.logo) {
        const previewContainer = document.getElementById("parceiro-logo-preview")
        previewContainer.innerHTML = `
                    <div class="admin-file-preview-item">
                        <img src="${parceiro.logo}" alt="Logo do parceiro">
                        <button type="button" class="remove-btn" data-field="logo"><i class="fas fa-times"></i></button>
                    </div>
                `

        // Adicionar event listener para o botão de remover
        previewContainer.querySelector(".remove-btn").addEventListener("click", () => {
          previewContainer.innerHTML = ""
        })
      }

      // Atualizar título do modal
      document.getElementById("parceiro-modal-title").textContent = "Editar Parceiro"

      // Abrir o modal
      openModal("parceiro-modal")
    } catch (error) {
      console.error("Erro ao carregar parceiro:", error)
      alert("Erro ao carregar dados do parceiro. Tente novamente.")
    }
  }

  async function viewMensagem(id) {
    try {
      const doc = await db.collection("contato").doc(id).get()
      if (!doc.exists) {
        alert("Mensagem não encontrada!")
        return
      }

      const mensagem = doc.data()

      // Preencher os campos do modal
      document.getElementById("mensagem-nome").textContent = mensagem.nome
      document.getElementById("mensagem-email").textContent = mensagem.email
      document.getElementById("mensagem-assunto").textContent = mensagem.assunto
      document.getElementById("mensagem-texto").textContent = mensagem.mensagem
      document.getElementById("mensagem-data").textContent = formatDate(mensagem.data.toDate())

      // Configurar botão de responder
      const responderBtn = document.getElementById("responder-mensagem")
      responderBtn.onclick = () => {
        const mailtoLink = `mailto:${mensagem.email}?subject=Re: ${mensagem.assunto}`
        window.open(mailtoLink)
      }

      // Abrir o modal
      openModal("mensagem-modal")
    } catch (error) {
      console.error("Erro ao carregar mensagem:", error)
      alert("Erro ao carregar dados da mensagem. Tente novamente.")
    }
  }

  // Funções para excluir registros
  async function deleteEvento(id) {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return

    try {
      await db.collection("eventos").doc(id).delete()
      alert("Evento excluído com sucesso!")
      loadData()
    } catch (error) {
      console.error("Erro ao excluir evento:", error)
      alert("Erro ao excluir evento. Tente novamente.")
    }
  }

  async function deletePrograma(id) {
    if (!confirm("Tem certeza que deseja excluir este programa?")) return

    try {
      await db.collection("programas").doc(id).delete()
      alert("Programa excluído com sucesso!")
      loadData()
    } catch (error) {
      console.error("Erro ao excluir programa:", error)
      alert("Erro ao excluir programa. Tente novamente.")
    }
  }

  async function deleteAgenda(id) {
    if (!confirm("Tem certeza que deseja excluir este item de agenda?")) return

    try {
      await db.collection("agenda").doc(id).delete()
      alert("Item de agenda excluído com sucesso!")
      loadData()
    } catch (error) {
      console.error("Erro ao excluir item de agenda:", error)
      alert("Erro ao excluir item de agenda. Tente novamente.")
    }
  }

  async function deleteNoticia(id) {
    if (!confirm("Tem certeza que deseja excluir esta notícia?")) return

    try {
      await db.collection("noticias").doc(id).delete()
      alert("Notícia excluída com sucesso!")
      loadData()
    } catch (error) {
      console.error("Erro ao excluir notícia:", error)
      alert("Erro ao excluir notícia. Tente novamente.")
    }
  }

  async function deleteMembro(id) {
    if (!confirm("Tem certeza que deseja excluir este membro?")) return

    try {
      await db.collection("membros").doc(id).delete()
      alert("Membro excluído com sucesso!")
      loadData()
    } catch (error) {
      console.error("Erro ao excluir membro:", error)
      alert("Erro ao excluir membro. Tente novamente.")
    }
  }

  async function deleteParceiro(id) {
    if (!confirm("Tem certeza que deseja excluir este parceiro?")) return

    try {
      await db.collection("parceiros").doc(id).delete()
      alert("Parceiro excluído com sucesso!")
      loadData()
    } catch (error) {
      console.error("Erro ao excluir parceiro:", error)
      alert("Erro ao excluir parceiro. Tente novamente.")
    }
  }

  async function deleteMensagem(id) {
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return

    try {
      await db.collection("contato").doc(id).delete()
      alert("Mensagem excluída com sucesso!")
      loadData()
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error)
      alert("Erro ao excluir mensagem. Tente novamente.")
    }
  }

  // Funções auxiliares
  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  }

  function formatDateForInput(dateString) {
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  // Configurar upload de arquivos
  function setupFileUpload(inputId, previewId, progressId) {
    const fileInput = document.getElementById(inputId)
    const previewContainer = document.getElementById(previewId)
    const progressBar = document.getElementById(progressId)

    fileInput.addEventListener("change", (e) => {
      const files = e.target.files
      if (!files.length) return

      previewContainer.innerHTML = ""

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()

        reader.onload = (e) => {
          const previewItem = document.createElement("div")
          previewItem.className = "admin-file-preview-item"

          if (file.type.startsWith("image/")) {
            previewItem.innerHTML = `
                            <img src="${e.target.result}" alt="Preview">
                            <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
                        `
          } else if (file.type.startsWith("video/")) {
            previewItem.innerHTML = `
                            <video src="${e.target.result}" controls></video>
                            <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
                        `
          }

          previewContainer.appendChild(previewItem)

          // Adicionar event listener para o botão de remover
          previewItem.querySelector(".remove-btn").addEventListener("click", () => {
            previewItem.remove()
            // Se for o último item, limpar o input
            if (previewContainer.children.length === 0) {
              fileInput.value = ""
            }
          })
        }

        reader.readAsDataURL(file)
      }
    })
  }

  // Configurar todos os uploads de arquivos
  setupFileUpload("evento-imagem", "evento-imagem-preview", "evento-imagem-progress")
  setupFileUpload("evento-galeria-imagens", "evento-galeria-imagens-preview", "evento-galeria-imagens-progress")
  setupFileUpload("evento-galeria-videos", "evento-galeria-videos-preview", "evento-galeria-videos-progress")
  setupFileUpload("agenda-galeria-imagens", "agenda-galeria-imagens-preview", "agenda-galeria-imagens-progress")
  setupFileUpload("agenda-galeria-videos", "agenda-galeria-videos-preview", "agenda-galeria-videos-progress")
  setupFileUpload("noticia-imagem", "noticia-imagem-preview", "noticia-imagem-progress")
  setupFileUpload("membro-imagem", "membro-imagem-preview", "membro-imagem-progress")
  setupFileUpload("parceiro-logo", "parceiro-logo-preview", "parceiro-logo-progress")

  // Função para fazer upload de arquivo para o Firebase Storage
  async function uploadFile(file, path, progressBarId) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      const storageRef = storage.ref();
      const fileRef = storageRef.child(path);
      const uploadTask = fileRef.put(file);

      // Mostrar a barra de progresso
      const progressBar = document.getElementById(progressBarId);
      if (progressBar) {
        progressBar.style.width = "0%";
        progressBar.parentElement.style.display = "block";
      }

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress (${path}):`, progress);

          if (progressBar) {
            progressBar.style.width = progress + "%";
          }
        },
        (error) => {
          console.error("Erro no upload:", error);
          reject(error);
        },
        async () => {
          if (progressBar) {
            progressBar.style.width = "100%";
            setTimeout(() => {
              progressBar.parentElement.style.display = "none";
            }, 1000);
          }

          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          resolve(downloadURL);
        }
      );
    });
  }

  // Submissão do formulário de evento
  document.getElementById("evento-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const id = document.getElementById("evento-id").value;
      const nome = document.getElementById("evento-nome").value;
      const tipo = document.getElementById("evento-tipo").value;
      const data = document.getElementById("evento-data").value;
      const descricao = document.getElementById("evento-descricao").value;
      const parceirosInput = document.getElementById("evento-parceiros").value;
      const flagsInput = document.getElementById("evento-flags").value;
      const destaque = document.getElementById("evento-destaque").checked;

      const parceiros = parceirosInput ? parceirosInput.split(",").map((item) => item.trim()) : [];
      const flags = flagsInput ? flagsInput.split(",").map((item) => item.trim()) : [];

      const imagemInput = document.getElementById("evento-imagem");
      let imagemURL = null;

      if (imagemInput.files.length > 0) {
        const file = imagemInput.files[0];
        const path = `eventos/${id || Date.now()}/imagem/${file.name}`;
        imagemURL = await uploadFile(file, path, "evento-imagem-progress");
      }

      const galeriaImagensInput = document.getElementById("evento-galeria-imagens");
      const galeriaVideosInput = document.getElementById("evento-galeria-videos");
      const galeria = [];

      if (galeriaImagensInput.files.length > 0) {
        for (const file of galeriaImagensInput.files) {
          const path = `eventos/${id || Date.now()}/galeria/imagens/${file.name}`;
          const url = await uploadFile(file, path, "evento-galeria-imagens-progress");
          galeria.push({ tipo: "imagem", legenda: file.name, thumbnail: url, url });
        }
      }

      if (galeriaVideosInput.files.length > 0) {
        for (const file of galeriaVideosInput.files) {
          const path = `eventos/${id || Date.now()}/galeria/videos/${file.name}`;
          const url = await uploadFile(file, path, "evento-galeria-videos-progress");
          galeria.push({ tipo: "video", legenda: file.name, thumbnail: null, url });
        }
      }

      const evento = { nome, tipo, data, descricao, parceiros, flags, destaque, imagem: imagemURL, galeria };

      if (id) {
        await db.collection("eventos").doc(id).update(evento);
        alert("Evento atualizado com sucesso!");
      } else {
        await db.collection("eventos").add(evento);
        alert("Evento adicionado com sucesso!");
      }

      closeModal("evento-modal");
      loadData();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      alert("Erro ao salvar evento. Tente novamente.");
    }
  });

  // Submissão do formulário de programa
  document.getElementById("programa-form").addEventListener("submit", async (e) => {
    e.preventDefault()

    try {
      const id = document.getElementById("programa-id").value
      const nome = document.getElementById("programa-nome").value
      const descricao = document.getElementById("programa-descricao").value
      const data_inicio = document.getElementById("programa-data-inicio").value
      const data_fim = document.getElementById("programa-data-fim").value
      const patrocinadores = document.getElementById("programa-patrocinadores").value

      // Processar arrays
      const patrocinadorArray = patrocinadores ? patrocinadores.split(",").map((item) => item.trim()) : []

      // Criar objeto do programa
      const programa = {
        nome,
        descricao,
        data_inicio,
        data_fim,
        patrocinadores: patrocinadorArray,
      }

      // Salvar no Firestore
      if (id) {
        // Atualizar programa existente
        await db.collection("programas").doc(id).update(programa)
        alert("Programa atualizado com sucesso!")
      } else {
        // Adicionar novo programa
        await db.collection("programas").add(programa)
        alert("Programa adicionado com sucesso!")
      }

      // Fechar modal e recarregar dados
      closeModal("programa-modal")
      loadData()
    } catch (error) {
      console.error("Erro ao salvar programa:", error)
      alert("Erro ao salvar programa. Tente novamente.")
    }
  })

  // Submissão do formulário de agenda
  document.getElementById("agenda-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const inscricao = document.getElementById("agenda-inscricao").value;

    // Validar o campo de inscrição
    if (inscricao && !/^https?:\/\/.+/.test(inscricao)) {
      alert("Por favor, insira um URL válido para o campo de inscrição.");
      return;
    }

    try {
      const id = document.getElementById("agenda-id").value;
      const nome = document.getElementById("agenda-nome").value;
      const tipo = document.getElementById("agenda-tipo").value;
      const flag = document.getElementById("agenda-flag").value;
      const descricao = document.getElementById("agenda-descricao").value;
      const data_inicio = document.getElementById("agenda-data-inicio").value;
      const data_fim = document.getElementById("agenda-data-fim").value;
      const parceirosInput = document.getElementById("agenda-parceiros").value;
      const destaque = document.getElementById("agenda-destaque").checked;

      const parceiros = parceirosInput ? parceirosInput.split(",").map((item) => item.trim()) : [];
      const galeria = [];

      // Adicionar novos itens da galeria
      const galeriaImagensInput = document.getElementById("agenda-galeria-imagens");
      const galeriaVideosInput = document.getElementById("agenda-galeria-videos");

      if (galeriaImagensInput.files.length > 0) {
        for (const file of galeriaImagensInput.files) {
          const path = `agendas/${id || Date.now()}/galeria/imagens/${file.name}`;
          const url = await uploadFile(file, path, "agenda-galeria-imagens-progress");
          galeria.push({ tipo: "imagem", legenda: file.name, thumbnail: url, url });
        }
      }

      if (galeriaVideosInput.files.length > 0) {
        for (const file of galeriaVideosInput.files) {
          const path = `agendas/${id || Date.now()}/galeria/videos/${file.name}`;
          const url = await uploadFile(file, path, "agenda-galeria-videos-progress");
          galeria.push({ tipo: "video", legenda: file.name, thumbnail: null, url });
        }
      }

      const agendaItem = {
        nome,
        tipo,
        flag,
        descricao,
        data_inicio,
        data_fim,
        parceiros,
        inscricao,
        destaque,
        galeria,
      };

      if (id) {
        await db.collection("agenda").doc(id).update(agendaItem);
        alert("Item de agenda atualizado com sucesso!");
      } else {
        await db.collection("agenda").add(agendaItem);
        alert("Item de agenda adicionado com sucesso!");
      }

      closeModal("agenda-modal");
      loadData();
    } catch (error) {
      console.error("Erro ao salvar item de agenda:", error);
      alert("Erro ao salvar item de agenda. Tente novamente.");
    }
  });

  // Submissão do formulário de notícia
  document.getElementById("noticia-form").addEventListener("submit", async (e) => {
    e.preventDefault()

    try {
      const id = document.getElementById("noticia-id").value
      const titulo = document.getElementById("noticia-titulo").value
      const data = document.getElementById("noticia-data").value
      const descricao = document.getElementById("noticia-descricao").value
      const link = document.getElementById("noticia-link").value
      const destaque = document.getElementById("noticia-destaque").checked

      // Processar imagem
      const imagemInput = document.getElementById("noticia-imagem")
      let imagemURL = null

      if (imagemInput.files.length > 0) {
        const file = imagemInput.files[0]
        const path = `noticias/${id || Date.now()}/imagem/${file.name}`
        imagemURL = await uploadFile(file, path, "noticia-imagem-progress")
      } else if (document.getElementById("noticia-imagem-preview").innerHTML !== "") {
        // Manter a imagem atual se não foi removida
        const img = document.getElementById("noticia-imagem-preview").querySelector("img")
        if (img) {
          imagemURL = img.src
        }
      }

      // Criar objeto da notícia
      const noticia = {
        titulo,
        data,
        descricao,
        link,
        destaque,
        imagem: imagemURL,
      }

      // Salvar no Firestore
      if (id) {
        // Atualizar notícia existente
        await db.collection("noticias").doc(id).update(noticia)
        alert("Notícia atualizada com sucesso!")
      } else {
        // Adicionar nova notícia
        await db.collection("noticias").add(noticia)
        alert("Notícia adicionada com sucesso!")
      }

      // Fechar modal e recarregar dados
      closeModal("noticia-modal")
      loadData()
    } catch (error) {
      console.error("Erro ao salvar notícia:", error)
      alert("Erro ao salvar notícia. Tente novamente.")
    }
  })

  // Submissão do formulário de membro
  document.getElementById("membro-form").addEventListener("submit", async (e) => {
    e.preventDefault()

    try {
      const id = document.getElementById("membro-id").value
      const nome = document.getElementById("membro-nome").value
      const cargo = document.getElementById("membro-cargo").value
      const descricao = document.getElementById("membro-descricao").value

      // Processar imagem
      const imagemInput = document.getElementById("membro-imagem")
      let imagemURL = null

      if (imagemInput.files.length > 0) {
        const file = imagemInput.files[0]
        const path = `membros/${id || Date.now()}/imagem/${file.name}`
        imagemURL = await uploadFile(file, path, "membro-imagem-progress")
      } else if (document.getElementById("membro-imagem-preview").innerHTML !== "") {
        // Manter a imagem atual se não foi removida
        const img = document.getElementById("membro-imagem-preview").querySelector("img")
        if (img) {
          imagemURL = img.src
        }
      }

      // Criar objeto do membro
      const membro = {
        nome,
        cargo,
        descricao,
        imagem: imagemURL,
      }

      // Salvar no Firestore
      if (id) {
        // Atualizar membro existente
        await db.collection("membros").doc(id).update(membro)
        alert("Membro atualizado com sucesso!")
      } else {
        // Adicionar novo membro
        await db.collection("membros").add(membro)
        alert("Membro adicionado com sucesso!")
      }

      // Fechar modal e recarregar dados
      closeModal("membro-modal")
      loadData()
    } catch (error) {
      console.error("Erro ao salvar membro:", error)
      alert("Erro ao salvar membro. Tente novamente.")
    }
  })

  // Submissão do formulário de parceiro
  document.getElementById("parceiro-form").addEventListener("submit", async (e) => {
    e.preventDefault()

    try {
      const id = document.getElementById("parceiro-id").value
      const nome = document.getElementById("parceiro-nome").value
      const descricao = document.getElementById("parceiro-descricao").value
      const website = document.getElementById("parceiro-website").value

      // Processar logo
      const logoInput = document.getElementById("parceiro-logo")
      let logoURL = null

      if (logoInput.files.length > 0) {
        const file = logoInput.files[0]
        const path = `parceiros/${id || Date.now()}/logo/${file.name}`
        logoURL = await uploadFile(file, path, "parceiro-logo-progress")
      } else if (document.getElementById("parceiro-logo-preview").innerHTML !== "") {
        // Manter o logo atual se não foi removida
        const img = document.getElementById("parceiro-logo-preview").querySelector("img")
        if (img) {
          logoURL = img.src
        }
      }

      // Criar objeto do parceiro
      const parceiro = {
        nome,
        descricao,
        website,
        logo: logoURL,
      }

      // Salvar no Firestore
      if (id) {
        // Atualizar parceiro existente
        await db.collection("parceiros").doc(id).update(parceiro)
        alert("Parceiro atualizado com sucesso!")
      } else {
        // Adicionar novo parceiro
        await db.collection("parceiros").add(parceiro)
        alert("Parceiro adicionado com sucesso!")
      }

      // Fechar modal e recarregar dados
      closeModal("parceiro-modal")
      loadData()
    } catch (error) {
      console.error("Erro ao salvar parceiro:", error)
      alert("Erro ao salvar parceiro. Tente novamente.")
    }
  })

  
})


