import fs from "node:fs";
import path from "node:path";
import AdminFirebaseScripts from "../components/AdminFirebaseScripts";
import {renderAdminMarkup} from "./markup.mjs";
import AdminTablePagination from "../components/AdminTablePagination";

const html = fs.readFileSync(path.join(process.cwd(), "public/admin/dashboard.html"), "utf8");
const markup = renderAdminMarkup(html);

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
