import fs from "node:fs";
import path from "node:path";
import AdminFirebaseScripts from "../components/AdminFirebaseScripts";
import "../../components/ui/workspace-panels.css";
import {renderAdminMarkup} from "./markup.mjs";
import AdminTablePagination from "../components/AdminTablePagination";
import { PrivateShell } from "../../components/private/private-shell";
import { PrivateWorkspaceTemplate } from "../../components/private/private-workspace-template";
import { CalendarDays, ContactRound, Handshake, Newspaper, PanelsTopLeft, UsersRound, Workflow } from "lucide-react";

const html = fs.readFileSync(path.join(process.cwd(), "app/admin/dashboard/dashboard-template.html"), "utf8");
const markup = renderAdminMarkup(html);

export const metadata = { title: "Painel administrativo | BaticAmigo" };

export default function AdminDashboardPage() {
  const navigation = [
    ["eventos", "Eventos", CalendarDays, "Conteúdo"], ["programas", "Programas", PanelsTopLeft, "Conteúdo"], ["agenda", "Agenda", Workflow, "Conteúdo"], ["noticias", "Notícias", Newspaper, "Conteúdo"],
    ["membros", "Membros", UsersRound, "Comunidade"], ["parceiros", "Parceiros", Handshake, "Comunidade"], ["contacto", "Contacto do site", ContactRound, "Site"],
  ].map(([key, label, Icon, group]) => ({ key, label, group, icon: <Icon size={17} strokeWidth={1.8} />, href: `#${key}-section` }));
  return (
    <PrivateShell className="admin-private-shell" areaLabel="Administração" items={navigation} active="eventos" navLabel="Gestão" accountMenu={<details className="admin-user-menu private-account-menu"><summary className="private-account-trigger" aria-label="Abrir opções da conta"><span className="private-account-avatar admin-user-avatar" id="user-avatar" aria-hidden="true">BA</span><span className="admin-user-menu-label">A minha conta</span></summary><div className="admin-user-menu-panel private-account-menu-panel"><span className="admin-user-identity private-account-menu-identity"><strong id="user-name">Administrador</strong><small id="user-email"/><small id="user-role">Administrador</small></span><a className="private-account-menu-link" href="/area?tab=account">O meu perfil</a><button id="admin-user-reset-password" className="admin-user-menu-action" type="button">Alterar palavra-passe</button><p id="admin-user-menu-status" role="status" aria-live="polite"/><button id="logout-btn" className="admin-logout-btn" type="button">Terminar sessão</button></div></details>} footer={<a href="/area"><PanelsTopLeft size={16} aria-hidden="true"/><span>Plataforma BaticAmigo</span><span aria-hidden="true">↗</span></a>}>
      <a className="skip-link" href="#conteudo-admin">Saltar para o conteúdo</a><PrivateWorkspaceTemplate id="conteudo-admin" className="dashboard-page" headingClassName="dashboard-welcome" eyebrow="Espaço de gestão" title={<>Gestão <em>BaticAmigo.</em></>} description="Conteúdos, iniciativas e comunidade num só lugar." action={<div className="platform-actions"><a className="admin-view-site" href="/platform/manual">Manual de utilização</a><a className="admin-view-site" href="/" target="_blank" rel="noreferrer">Ver site <span aria-hidden="true">↗</span></a></div>}>
        <div id="admin-init-error" className="admin-init-error" role="alert" hidden />
        <div dangerouslySetInnerHTML={{ __html: markup }} />
      </PrivateWorkspaceTemplate>
      <AdminTablePagination />
      <AdminFirebaseScripts />
    </PrivateShell>
  );
}
