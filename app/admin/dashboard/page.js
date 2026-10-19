import fs from "node:fs";
import path from "node:path";
import AdminFirebaseScripts from "../components/AdminFirebaseScripts";

const html = fs.readFileSync(path.join(process.cwd(), "public/admin/dashboard.html"), "utf8");
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
const markup = body
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/\.\.\/images\//g, "/images/");

export const metadata = { title: "Painel administrativo | BaticAmigo" };

export default function AdminDashboardPage() {
  return <><main className="dashboard-page"><div className="dashboard-welcome"><span className="eyebrow">Espaço de gestão</span><h1>Bom dia. <em>A comunidade espera.</em></h1><p>Organize iniciativas, conteúdos e momentos que aproximam pessoas.</p></div><div dangerouslySetInnerHTML={{ __html: markup }} /></main><AdminFirebaseScripts page="dashboard"/></>;
}
