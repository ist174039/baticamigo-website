"use client";

import { useEffect } from "react";

const tableIds = [
  "eventos-table-body",
  "programas-table-body",
  "agenda-table-body",
  "noticias-table-body",
  "membros-table-body",
  "parceiros-table-body",
];

const tableLabels = {
  "eventos-table-body": "eventos",
  "programas-table-body": "programas",
  "agenda-table-body": "agenda",
  "noticias-table-body": "notícias",
  "membros-table-body": "membros",
  "parceiros-table-body": "parceiros",
};

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
      controls.setAttribute("aria-label", `Filtros e paginação da lista ${tableLabels[id]}`);
      controls.innerHTML = `
        <div class="admin-table-tools">
          <label class="admin-table-search">
            <span>Filtrar ${tableLabels[id]}</span>
            <input type="search" placeholder="Pesquisar nesta lista" autocomplete="off" aria-label="Filtrar ${tableLabels[id]}" />
          </label>
          <label class="admin-page-size">
            <span>Por página</span>
            <select aria-label="Registos por página"><option value="8">8</option><option value="16">16</option><option value="32">32</option></select>
          </label>
        </div>
        <div class="admin-pagination-summary">
          <span class="admin-pagination-count" aria-live="polite"></span>
          <div class="admin-pagination-actions">
            <button type="button" data-page="previous" aria-label="Página anterior">Anterior</button>
            <span class="admin-pagination-page" aria-live="polite"></span>
            <button type="button" data-page="next" aria-label="Página seguinte">Seguinte</button>
          </div>
        </div>
      `;
      wrapper.insertAdjacentElement("beforebegin", controls);

      const previous = controls.querySelector('[data-page="previous"]');
      const next = controls.querySelector('[data-page="next"]');
      const count = controls.querySelector(".admin-pagination-count");
      const label = controls.querySelector(".admin-pagination-page");
      const search = controls.querySelector('input[type="search"]');
      const pageSizeSelect = controls.querySelector("select");
      let pageSize = Number(pageSizeSelect.value);

      function render() {
        const rows = Array.from(tbody.querySelectorAll(":scope > tr"));
        const query = search.value.trim().toLocaleLowerCase();
        const filteredRows = rows.filter((row) => !query || row.textContent.toLocaleLowerCase().includes(query));
        const pages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
        page = Math.min(Math.max(page, 1), pages);
        rows.forEach((row) => { row.hidden = true; });
        filteredRows.forEach((row, index) => {
          row.hidden = index < (page - 1) * pageSize || index >= page * pageSize;
        });

        count.textContent = filteredRows.length
          ? `A mostrar ${Math.min((page - 1) * pageSize + 1, filteredRows.length)}–${Math.min(page * pageSize, filteredRows.length)} de ${filteredRows.length}${query ? ` (filtrados de ${rows.length})` : ""}`
          : query ? `Nenhum resultado para “${search.value.trim()}”.` : "Ainda não há registos nesta lista.";
        label.textContent = `Página ${page} de ${pages}`;
        previous.disabled = page <= 1;
        next.disabled = page >= pages;
        controls.hidden = rows.length === 0;
      }

      previous.onclick = () => { page -= 1; render(); };
      next.onclick = () => { page += 1; render(); };
      const onSearch = () => { page = 1; render(); };
      const onPageSizeChange = () => { pageSize = Number(pageSizeSelect.value); page = 1; render(); };
      search.addEventListener("input", onSearch);
      pageSizeSelect.addEventListener("change", onPageSizeChange);

      const observer = new MutationObserver(() => { page = 1; render(); });
      observer.observe(tbody, { childList: true });
      render();
      cleanups.push(() => {
        observer.disconnect();
        previous.onclick = null;
        next.onclick = null;
        search.removeEventListener("input", onSearch);
        pageSizeSelect.removeEventListener("change", onPageSizeChange);
        controls.remove();
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
