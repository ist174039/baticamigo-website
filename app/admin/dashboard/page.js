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
      <li><a href="#eventos-section" class="active" data-section="eventos"><i class="fas fa-calendar-check"></i>Eventos</a></li>
      <li><a href="#programas-section" data-section="programas"><i class="fas fa-layer-group"></i>Programas</a></li>
      <li><a href="#agenda-section" data-section="agenda"><i class="fas fa-clock"></i>Agenda</a></li>
      <li><a href="#noticias-section" data-section="noticias"><i class="fas fa-newspaper"></i>Notícias</a></li>
      <li class="admin-nav-group admin-nav-group-people">Comunidade</li>
      <li><a href="#membros-section" data-section="membros"><i class="fas fa-users"></i>Membros</a></li>
      <li><a href="#parceiros-section" data-section="parceiros"><i class="fas fa-handshake"></i>Parceiros</a></li>
    </ul>`
  )
  // Add short context and a consistent jump-to-list action without changing
  // the table bodies or the Firebase IDs used by the CRUD scripts.
  .replace(
    /<div id="(eventos|programas|agenda|noticias|membros|parceiros)-section" class="admin-section( active)?">\s*<div class="admin-card">\s*<div class="admin-card-header">\s*<h3>Lista de ([^<]+)<\/h3>/g,
    (_match, key, active, label) => `<div id="${key}-section" class="admin-section${active || ""}">
                    <div class="admin-section-intro"><span>Área de gestão</span><p>Acompanhe, edite e organize os registos da comunidade num só lugar.</p></div>
                    <div class="admin-card">
                        <div class="admin-card-header">
                            <div class="admin-card-heading"><span class="admin-card-kicker">Registos</span><h3>Lista de ${label}</h3></div>
                            <div class="admin-card-actions"><a class="admin-list-link" href="#${key}-table-body">Ver lista <span aria-hidden="true">↓</span></a>`
  )
  .replace(
    /<button id="add-(evento|programa|agenda|noticia|membro|parceiro)-btn" class="admin-btn primary-btn">([^<]+)<\/button>/g,
    (_match, key, label) => `<button id="add-${key}-btn" class="admin-btn primary-btn">${label}<span aria-hidden="true">＋</span></button></div>`
  );

export const metadata = { title: "Painel administrativo | BaticAmigo" };

export default function AdminDashboardPage() {
  return <><main className="dashboard-page"><div className="dashboard-welcome"><span className="eyebrow">Espaço de gestão</span><h1>Bom dia. <em>A comunidade espera.</em></h1><p>Organize iniciativas, conteúdos e momentos que aproximam pessoas.</p></div><div id="admin-init-error" className="admin-init-error" role="alert" hidden/><div dangerouslySetInnerHTML={{ __html: markup }} /></main><AdminTablePagination/><AdminFirebaseScripts page="dashboard"/></>;
}
