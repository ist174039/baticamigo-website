"use client";

import { useEffect } from "react";

const firebaseApp = "https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js";
const firebaseServices = [
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js",
];
const pageScripts = [
  "/js/firebase-config.js",
  "/js/firebase-init.js",
  "/js/main.js",
  "/js/firebase-data-loader.js",
  "/js/contact-form-firebase.js",
];
const scriptLoads = new Map();

function loadScript(src) {
  if (scriptLoads.has(src)) return scriptLoads.get(src);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => {
      scriptLoads.delete(src);
      reject(new Error(`Não foi possível carregar ${src}`));
    };
    document.body.appendChild(script);
  });
  scriptLoads.set(src, promise);
  return promise;
}

export default function LegacyFirebaseScripts() {
  useEffect(() => {
    let cancelled = false;
    async function loadInOrder() {
      await loadScript(firebaseApp);
      await Promise.all(firebaseServices.map(loadScript));
      for (const src of pageScripts) {
        if (cancelled) return;
        await loadScript(src);
      }
      if (!cancelled) document.dispatchEvent(new Event("DOMContentLoaded"));
    }

    loadInOrder().catch((error) => {
      console.error("Erro ao iniciar os recursos do site:", error);
      ["members-container", "partners-container"].forEach((id) => {
        const container = document.getElementById(id);
        if (!container) return;
        container.dataset.collectionState = "error";
        container.innerHTML = '<p class="no-results">Não foi possível carregar esta lista. Atualize a página para tentar novamente.</p>';
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
