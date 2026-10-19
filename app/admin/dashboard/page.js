import fs from "node:fs";
import path from "node:path";
import Script from "next/script";

const html = fs.readFileSync(path.join(process.cwd(), "public/admin/dashboard.html"), "utf8");
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
const markup = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

export default function AdminDashboardPage() {
  return <>
    <div dangerouslySetInnerHTML={{ __html: markup }} />
    <Script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js" strategy="beforeInteractive" />
    <Script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js" strategy="beforeInteractive" />
    <Script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js" strategy="beforeInteractive" />
    <Script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js" strategy="beforeInteractive" />
    <Script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-functions.js" strategy="beforeInteractive" />
    <Script src="/admin/js/firebaseConfig.js" type="module" strategy="afterInteractive" />
    <Script src="/admin/js/admin.js" type="module" strategy="afterInteractive" />
  </>;
}
