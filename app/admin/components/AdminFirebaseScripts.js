"use client";

import { useEffect } from "react";

const scripts = [
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js",
];

// The admin area can mount twice in React Strict Mode. Keep script loading
// shared at module scope so Firebase is initialized once per document.
const scriptLoads = new Map();
const initializedPages = new Set();

function loadScript(src, module = false) {
  if (scriptLoads.has(src)) return scriptLoads.get(src);

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    if (module) script.type = "module";
    script.onload = resolve;
    script.onerror = () => {
      scriptLoads.delete(src);
      reject(new Error(`Falha ao carregar ${src}`));
    };
    document.body.appendChild(script);
  });
  scriptLoads.set(src, promise);
  return promise;
}

export default function AdminFirebaseScripts({ page }) {
  useEffect(() => {
    let cancelled = false;
    async function start() {
      await loadScript(scripts[0]);
      await Promise.all(scripts.slice(1).map((src) => loadScript(src)));
      if (cancelled) return;
      await loadScript("/admin/js/firebaseConfig.js", true);
      await loadScript(`/admin/js/${page === "login" ? "auth" : "admin"}.js`, true);
      if (!cancelled && !initializedPages.has(page)) {
        initializedPages.add(page);
        document.dispatchEvent(new Event("DOMContentLoaded"));
      }
    }
    start().catch((error) => {
      console.error("Erro ao iniciar administração:", error);
      const errorBox = document.getElementById("login-error") || document.getElementById("admin-init-error");
      if (errorBox) {
        errorBox.textContent = "Não foi possível iniciar o acesso administrativo. Atualize a página e tente novamente.";
        errorBox.hidden = false;
        errorBox.style.display = "block";
      }
    });
    return () => {
      cancelled = true;
    };
  }, [page]);
  return null;
}
