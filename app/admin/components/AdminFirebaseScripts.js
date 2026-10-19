"use client";

import { useEffect } from "react";

const scripts = [
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-functions.js",
];

export default function AdminFirebaseScripts({ page }) {
  useEffect(() => {
    let cancelled = false;
    const loaded = [];
    async function loadScript(src, module = false) {
      const script = document.createElement("script");
      script.src = src;
      if (module) script.type = "module";
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
        document.body.appendChild(script);
      });
      loaded.push(script);
    }
    async function start() {
      for (const src of scripts) {
        if (cancelled) return;
        await loadScript(src);
      }
      await loadScript("/admin/js/firebaseConfig.js", true);
      await loadScript(`/admin/js/${page === "login" ? "auth" : "admin"}.js`, true);
      if (!cancelled) document.dispatchEvent(new Event("DOMContentLoaded"));
    }
    start().catch((error) => console.error("Erro ao iniciar administração:", error));
    return () => {
      cancelled = true;
      loaded.forEach((script) => script.remove());
    };
  }, [page]);
  return null;
}
