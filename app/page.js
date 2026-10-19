import fs from "node:fs";
import path from "node:path";
import Script from "next/script";

const html = fs.readFileSync(path.join(process.cwd(), "public/legacy-home.html"), "utf8");
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
const markup = body
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<script\b[^>]*\/>/gi, "")
  .replace(/\s(?:src|href)="(?:css|js|images)\//g, ' $&')
  .replace(/(?:src|href)="(css|js|images)\//g, 'src="/$1/');

export default function HomePage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: markup }} />
      <Script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js" strategy="beforeInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js" strategy="beforeInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js" strategy="beforeInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js" strategy="beforeInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-functions.js" strategy="beforeInteractive" />
      <Script src="/js/firebase-config.js" strategy="afterInteractive" />
      <Script src="/js/firebase-init.js" strategy="afterInteractive" />
      <Script src="/js/main.js" strategy="afterInteractive" />
      <Script src="/js/firebase-data-loader.js" strategy="afterInteractive" />
      <Script src="/js/carousel-firebase.js" strategy="afterInteractive" />
      <Script src="/js/contact-form-firebase.js" strategy="afterInteractive" />
      <Script src="/js/debug.js" strategy="afterInteractive" />
    </>
  );
}
