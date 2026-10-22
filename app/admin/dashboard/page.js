import fs from "node:fs";
import path from "node:path";
import AdminFirebaseScripts from "../components/AdminFirebaseScripts";
import {renderAdminMarkup} from "./markup.mjs";
import AdminTablePagination from "../components/AdminTablePagination";
import { PrivateShell } from "../../components/private/private-shell";
import { PrivatePageHeading } from "../../components/private/private-page-heading";
import { CalendarDays, ContactRound, Handshake, Newspaper, PanelsTopLeft, Settings2, UsersRound, Workflow } from "lucide-react";

const html = fs.readFileSync(path.join(process.cwd(), "public/admin/dashboard.html"), "utf8");
const markup = renderAdminMarkup(html);

export const metadata = { title: "Painel administrativo | BaticAmigo" };

export default function AdminDashboardPage() {
  const navigation = [
    ["eventos", "Eventos", CalendarDays], ["programas", "Programas", PanelsTopLeft], ["agenda", "Agenda", Workflow], ["noticias", "Notícias", Newspaper],
    ["membros", "Membros", UsersRound], ["parceiros", "Parceiros", Handshake], ["contacto", "Contacto do site", ContactRound], ["perfil", "Meu perfil", Settings2],
  ].map(([key, label, Icon]) => ({ key, label, icon: <Icon size={17} strokeWidth={1.8} />, href: `#${key}-section` }));
  return (
    <PrivateShell className="admin-private-shell" areaLabel="Administração" items={navigation} active="eventos" navLabel="Gestão" footer={<a href="/area"><PanelsTopLeft size={16} aria-hidden="true"/><span>Plataforma BaticAmigo</span><span aria-hidden="true">↗</span></a>}>
      <a className="skip-link" href="#conteudo-admin">Saltar para o conteúdo</a><main id="conteudo-admin" tabIndex={-1} className="dashboard-page">
        <PrivatePageHeading
          className="dashboard-welcome"
          eyebrow="Espaço de gestão"
          title={<>Gestão <em>BaticAmigo.</em></>}
          description="Conteúdos, iniciativas e comunidade num só lugar."
          action={<a className="admin-view-site" href="/" target="_blank" rel="noreferrer">Ver site <span aria-hidden="true">↗</span></a>}
        />
        <div id="admin-init-error" className="admin-init-error" role="alert" hidden />
        <div dangerouslySetInnerHTML={{ __html: markup }} />
      </main>
      <AdminTablePagination />
      <AdminFirebaseScripts />
    </PrivateShell>
  );
}
