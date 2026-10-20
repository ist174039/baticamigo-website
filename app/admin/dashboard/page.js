import fs from "node:fs";
import path from "node:path";
import AdminFirebaseScripts from "../components/AdminFirebaseScripts";
import AdminTablePagination from "../components/AdminTablePagination";

const html = fs.readFileSync(path.join(process.cwd(), "public/admin/dashboard.html"), "utf8");
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
const markup = body
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/\.\.\/images\//g, "/images/")
  // The legacy dashboard left this menu empty; keep the IDs and data-section
  // contract consumed by admin.js while giving each collection a clear home.
  .replace(
    /<ul class="admin-sidebar-menu">\s*<\/ul>/,
    `<div class="admin-nav-label">Gestão</div>
    <ul class="admin-sidebar-menu">
      <li class="admin-nav-group">Conteúdo</li>
      <li><a href="#eventos-section" class="active" aria-current="page" data-section="eventos"><i class="fas fa-calendar-check"></i>Eventos</a></li>
      <li><a href="#programas-section" data-section="programas"><i class="fas fa-layer-group"></i>Programas</a></li>
      <li><a href="#agenda-section" data-section="agenda"><i class="fas fa-clock"></i>Agenda</a></li>
      <li><a href="#noticias-section" data-section="noticias"><i class="fas fa-newspaper"></i>Notícias</a></li>
      <li class="admin-nav-group admin-nav-group-people">Comunidade</li>
      <li><a href="#membros-section" data-section="membros"><i class="fas fa-users"></i>Membros</a></li>
      <li><a href="#parceiros-section" data-section="parceiros"><i class="fas fa-handshake"></i>Parceiros</a></li>
      <li><a href="#utilizadores-section" data-section="utilizadores"><i class="fas fa-user-shield"></i>Utilizadores</a></li>
      <li class="admin-nav-group admin-nav-group-settings">Site</li>
      <li><a href="#contacto-section" data-section="contacto"><i class="fas fa-address-card"></i>Contacto do site</a></li>
      <li><a href="#perfil-section" data-section="perfil"><i class="fas fa-user-circle"></i>Meu perfil</a></li>
    </ul>`
  )
  // Add short context and a consistent jump-to-list action without changing
  // the table bodies or the Firebase IDs used by the CRUD scripts.
  .replace(
    /<div id="(eventos|programas|agenda|noticias|membros|parceiros)-section" class="admin-section( active)?">\s*<div class="admin-card">\s*<div class="admin-card-header">\s*<h3>Lista de ([^<]+)<\/h3>/g,
    (_match, key, active, label) => `<div id="${key}-section" class="admin-section${active || ""}">
                    <div class="admin-card">
                        <div class="admin-card-header">
                            <div class="admin-card-heading"><span class="admin-card-kicker">Registos</span><h3>Lista de ${label}</h3></div>
                            <div class="admin-card-actions"><a class="admin-list-link" href="#${key}-table-body">Ver lista <span aria-hidden="true">↓</span></a>`
  )
  .replace(
    /<button id="add-(evento|programa|agenda|noticia|membro|parceiro)-btn" class="admin-btn primary-btn">([^<]+)<\/button>/g,
    (_match, key, label) => `<button id="add-${key}-btn" class="admin-btn primary-btn">${label}<span aria-hidden="true">＋</span></button></div>`
  )
  .replace(
    /(<div id="membros-section" class="admin-section">)/,
    `<div id="perfil-section" class="admin-section">
                    <section class="admin-card profile-card" aria-labelledby="profile-title">
                      <div class="admin-card-header"><div class="admin-card-heading"><span class="admin-card-kicker">A sua conta</span><h3 id="profile-title">Perfil e segurança</h3></div></div>
                      <form id="profile-form" class="admin-settings-form">
                        <div class="profile-identity"><span id="profile-avatar" class="profile-avatar" aria-hidden="true">BA</span><div><strong id="profile-display-name">Administrador</strong><span id="profile-account-email"></span></div></div>
                        <div><label for="profile-name">Nome apresentado no painel</label><input id="profile-name" name="displayName" type="text" maxlength="80" autocomplete="name" placeholder="O seu nome" required></div>
                        <div class="admin-settings-footer"><p id="profile-settings-status" role="status" aria-live="polite"></p><button class="admin-btn primary-btn" type="submit">Guardar nome</button></div>
                      </form>
                    </section>
                    <section class="admin-card profile-security-card" aria-labelledby="profile-security-title">
                      <div class="admin-card-header"><div class="admin-card-heading"><span class="admin-card-kicker">Acesso à conta</span><h3 id="profile-security-title">Palavra-passe</h3></div></div>
                      <div class="profile-security-content"><p>Enviaremos uma ligação segura para o email da conta para redefinir a palavra-passe.</p><button id="profile-reset-password" type="button" class="admin-btn secondary-btn">Enviar ligação de recuperação</button><p id="profile-password-status" role="status" aria-live="polite"></p></div>
                    </section>
                </div>
                <div id="contacto-section" class="admin-section">
                    <section class="admin-card admin-settings-card" aria-labelledby="contact-settings-title">
                      <div class="admin-card-header"><div class="admin-card-heading"><span class="admin-card-kicker">Conteúdo do site</span><h3 id="contact-settings-title">Informações de contacto</h3></div></div>
                      <form id="contact-settings-form" class="admin-settings-form">
                        <label for="contact-intro">Mensagem de apresentação</label>
                        <textarea id="contact-intro" name="intro" rows="3" required>Quer saber mais, colaborar ou fazer parte? Estamos prontos para ouvir.</textarea>
                        <div class="admin-settings-grid">
                          <div><label for="contact-email">Email</label><input id="contact-email" name="email" type="email" value="info@baticamigo.pt" required></div>
                          <div><label for="contact-address">Morada</label><input id="contact-address" name="address" type="text" value="Avenida Dr. Arlindo Vicente, Lote 370 A, loja 1" required></div>
                        </div>
                        <div><label for="contact-instagram">Link do Instagram</label><input id="contact-instagram" name="instagram" type="url" value="https://www.instagram.com/aba2022cultura/" required></div>
                        <div class="admin-settings-footer"><p id="contact-settings-status" role="status" aria-live="polite"></p><button id="save-contact-settings" class="admin-btn primary-btn" type="submit">Guardar alterações</button></div>
                      </form>
                    </section>
                $1`
  )
  .replace(
    /(<div id="contacto-section" class="admin-section">)/,
    `<div id="utilizadores-section" class="admin-section">
                    <section class="admin-card" aria-labelledby="admin-users-title">
                      <div class="admin-card-header">
                        <div class="admin-card-heading"><span class="admin-card-kicker">Acesso ao painel</span><h3 id="admin-users-title">Contas administrativas</h3></div>
                        <div class="admin-card-actions"><button id="admin-users-open-form" class="admin-btn primary-btn" type="button">Adicionar utilizador <span aria-hidden="true">＋</span></button></div>
                      </div>
                      <div class="admin-users-content">
                        <p class="admin-users-note">Cada conta criada recebe acesso administrativo ao painel. Envie a ligação de recuperação ao novo utilizador para definir a palavra-passe.</p>
                        <form id="admin-users-create-form" class="admin-users-create-form" hidden>
                          <div><label for="admin-users-name">Nome</label><input id="admin-users-name" name="displayName" type="text" maxlength="100" autocomplete="name" required></div>
                          <div><label for="admin-users-email">Email</label><input id="admin-users-email" name="email" type="email" maxlength="254" autocomplete="email" required></div>
                          <div class="admin-users-form-actions"><button class="admin-btn primary-btn" type="submit">Criar conta</button><button id="admin-users-cancel-form" class="admin-btn secondary-btn" type="button">Cancelar</button></div>
                        </form>
                        <div id="admin-users-link-result" class="admin-users-link-result" role="status" aria-live="polite" hidden>
                          <strong id="admin-users-link-title"></strong><p>Partilhe esta ligação com a pessoa para definir uma palavra-passe. A ligação é apresentada apenas nesta sessão.</p>
                          <div><input id="admin-users-link" type="url" readonly aria-label="Ligação de recuperação"><button id="admin-users-copy-link" class="admin-btn secondary-btn" type="button">Copiar ligação</button></div>
                        </div>
                        <div class="admin-users-toolbar">
                          <label class="admin-table-search"><span>Pesquisar nesta página</span><input id="admin-users-search" type="search" placeholder="Nome ou email" autocomplete="off"></label>
                          <span id="admin-users-page-count" class="admin-pagination-count" aria-live="polite"></span>
                        </div>
                        <p id="admin-users-status" class="admin-users-status" role="status" aria-live="polite"></p>
                        <div class="admin-table-container"><table class="admin-table admin-users-table">
                          <thead><tr><th>Utilizador</th><th>Acesso</th><th>Último acesso</th><th>Ações</th></tr></thead>
                          <tbody id="admin-users-table-body"><tr><td colspan="4">A carregar contas…</td></tr></tbody>
                        </table></div>
                        <div class="admin-users-pagination"><span id="admin-users-page-label" class="admin-pagination-page" aria-live="polite">Página 1</span><div class="admin-pagination-actions"><button id="admin-users-previous" type="button" disabled>Anterior</button><button id="admin-users-next" type="button" disabled>Seguinte</button></div></div>
                      </div>
                    </section>
                </div>
                $1`
  );

export const metadata = { title: "Painel administrativo | BaticAmigo" };

export default function AdminDashboardPage() {
  return (
    <>
      <a className="skip-link" href="#conteudo-admin">Saltar para o conteúdo</a><main id="conteudo-admin" tabIndex={-1} className="dashboard-page">
        <header className="dashboard-welcome">
          <div>
            <span className="eyebrow">Espaço de gestão</span>
            <h1>Gestão <em>BaticAmigo.</em></h1>
            <p>Conteúdos, iniciativas e comunidade num só lugar.</p>
          </div>
          <a className="admin-view-site" href="/" target="_blank" rel="noreferrer">Ver site <span aria-hidden="true">↗</span></a>
        </header>
        <div id="admin-init-error" className="admin-init-error" role="alert" hidden />
        <div dangerouslySetInnerHTML={{ __html: markup }} />
      </main>
      <AdminTablePagination />
      <AdminFirebaseScripts page="dashboard" />
    </>
  );
}
