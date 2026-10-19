"use client";

import { useEffect } from "react";

const pageSize = 8;
const tableIds = [
  "eventos-table-body",
  "programas-table-body",
  "agenda-table-body",
  "noticias-table-body",
  "membros-table-body",
  "parceiros-table-body",
];

export default function AdminTablePagination() {
  useEffect(() => {
    const cleanups = [];

    tableIds.forEach((id) => {
      const tbody = document.getElementById(id);
      const wrapper = tbody?.closest(".admin-table-container");
      if (!tbody || !wrapper) return;

      let page = 1;
      const controls = document.createElement("div");
      controls.className = "admin-pagination";
      controls.setAttribute("role", "group");
      controls.setAttribute("aria-label", `Paginação da lista ${id.replace("-table-body", "")}`);
      controls.innerHTML = `
        <span class="admin-pagination-count" aria-live="polite"></span>
        <div class="admin-pagination-actions">
          <button type="button" data-page="previous" aria-label="Página anterior">Anterior</button>
          <span class="admin-pagination-page"></span>
          <button type="button" data-page="next" aria-label="Página seguinte">Seguinte</button>
        </div>
      `;
      wrapper.insertAdjacentElement("afterend", controls);

      const previous = controls.querySelector('[data-page="previous"]');
      const next = controls.querySelector('[data-page="next"]');
      const count = controls.querySelector(".admin-pagination-count");
      const label = controls.querySelector(".admin-pagination-page");

      function render() {
        const rows = Array.from(tbody.querySelectorAll(":scope > tr"));
        const pages = Math.max(1, Math.ceil(rows.length / pageSize));
        page = Math.min(Math.max(page, 1), pages);
        rows.forEach((row, index) => {
          row.hidden = index < (page - 1) * pageSize || index >= page * pageSize;
        });

        controls.hidden = rows.length > 0 && rows.length <= pageSize;
        count.textContent = rows.length
          ? `A mostrar ${Math.min((page - 1) * pageSize + 1, rows.length)}–${Math.min(page * pageSize, rows.length)} de ${rows.length}`
          : "Ainda não há registos nesta lista.";
        label.textContent = `Página ${page} de ${pages}`;
        previous.disabled = page <= 1;
        next.disabled = page >= pages;
      }

      previous.onclick = () => { page -= 1; render(); };
      next.onclick = () => { page += 1; render(); };

      const observer = new MutationObserver(() => { page = 1; render(); });
      observer.observe(tbody, { childList: true });
      render();
      cleanups.push(() => {
        observer.disconnect();
        previous.onclick = null;
        next.onclick = null;
        controls.remove();
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
