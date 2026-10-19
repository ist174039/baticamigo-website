"use client";

import { useEffect } from "react";

const scripts = [
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-functions.js",
  "/js/firebase-config.js",
  "/js/firebase-init.js",
  "/js/main.js",
  "/js/firebase-data-loader.js",
  "/js/contact-form-firebase.js",
];

export default function LegacyFirebaseScripts() {
  useEffect(() => {
    let cancelled = false;
    const loaded = [];

    async function loadInOrder() {
      for (const src of scripts) {
        if (cancelled) return;
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
          document.body.appendChild(script);
        });
        loaded.push(script);
      }
      if (!cancelled) document.dispatchEvent(new Event("DOMContentLoaded"));
    }

    loadInOrder().catch((error) => console.error("Erro ao iniciar os recursos do site:", error));
    return () => {
      cancelled = true;
      loaded.forEach((script) => script.remove());
    };
  }, []);

  return null;
}
