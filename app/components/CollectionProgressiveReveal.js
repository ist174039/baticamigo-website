"use client";

import { useEffect } from "react";

const collections = [
  { id: "events-container", searchId: "eventos-search", label: "eventos", item: ".event-card", batch: 3 },
  { id: "programs-container", searchId: "programas-search", label: "programas", item: ".program-card", batch: 3 },
  { id: "agenda-container", searchId: "agenda-search", label: "itens da agenda", item: ".agenda-card", batch: 3 },
  { id: "news-container", label: "notícias", item: ".news-card", batch: 3 },
  { id: "members-container", label: "membros", item: ".member-card", batch: 3 },
  { id: "partners-container", label: "parceiros", item: ".partner-card", batch: 3 },
];

export default function CollectionProgressiveReveal() {
  useEffect(() => {
    const cleanups = new Map();

    // The Firebase loader runs after hydration and may replace the list nodes.
    // Keep looking for the containers and observe their descendants so a late
    // render, filter, or replacement always recalculates the visible batch.
    function attach({ id, searchId, label, item, batch }) {
      if (cleanups.has(id)) return;
      const container = document.getElementById(id);
      if (!container) return;

      let visibleCount = batch;
      let controls = container.nextElementSibling;
      let createdControls = false;
      if (!controls?.classList.contains("collection-reveal-controls")) {
        controls = document.createElement("div");
        controls.className = "collection-reveal-controls";
        controls.innerHTML = '<button type="button" class="collection-reveal-button"></button>';
        controls.setAttribute("aria-label", `Lista de ${label}`);
        container.insertAdjacentElement("afterend", controls);
        createdControls = true;
      }
      const button = controls.querySelector("button");

      function update() {
        const cards = Array.from(container.querySelectorAll(item));
        visibleCount = Math.max(batch, Math.min(visibleCount, cards.length));
        cards.forEach((card, index) => card.classList.toggle("collection-item-hidden", index >= visibleCount));
        controls.hidden = cards.length <= batch;
        if (cards.length <= batch) {
          button.textContent = "";
          button.onclick = null;
          return;
        }

        const hasMore = visibleCount < cards.length;
        button.textContent = hasMore ? `Ver mais (${cards.length - visibleCount})` : "Mostrar menos";
        button.setAttribute("aria-controls", id);
        button.setAttribute("aria-label", hasMore ? `Ver mais ${label}` : `Mostrar menos ${label}`);
        button.setAttribute("aria-expanded", String(!hasMore));
        button.onclick = () => {
          visibleCount = hasMore ? Math.min(visibleCount + batch, cards.length) : batch;
          update();
          if (!hasMore) container.scrollIntoView({ behavior: "smooth", block: "start" });
        };
      }

      const searchInput = searchId ? document.getElementById(searchId) : null;
      const resetList = () => {
        visibleCount = batch;
        update();
      };
      searchInput?.addEventListener("input", resetList);

      const observer = new MutationObserver(update);
      observer.observe(container, { childList: true, subtree: true });
      update();
      cleanups.set(id, () => {
        observer.disconnect();
        searchInput?.removeEventListener("input", resetList);
        button.onclick = null;
        if (createdControls) controls.remove();
      });
    }

    const attachExisting = () => collections.forEach(attach);
    attachExisting();
    const documentObserver = new MutationObserver(attachExisting);
    documentObserver.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      documentObserver.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
    };
  }, []);

  return null;
}
