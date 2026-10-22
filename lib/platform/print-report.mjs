const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

export function buildPrintableReport({ title, subtitle = "", columns = [], rows = [], summary = "", orientation = "landscape" }) {
  const pageOrientation = orientation === "portrait" ? "portrait" : "landscape";
  const header = columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("");
  const body = rows.length
    ? rows.map((row) => `<tr>${columns.map((_, index) => `<td>${escapeHtml(row[index])}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${Math.max(columns.length, 1)}" class="empty">Sem registos para apresentar.</td></tr>`;

  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
    @page{size:A4 ${pageOrientation};margin:16mm}*{box-sizing:border-box}body{margin:0;color:#2d183b;font:11px/1.5 Arial,sans-serif}header{display:flex;align-items:center;gap:14px;padding-bottom:16px;border-bottom:2px solid #603477}header img{width:48px;height:42px;object-fit:contain}header div{flex:1}h1{margin:0;font-size:22px;letter-spacing:-.04em}header p{margin:4px 0 0;color:#665a6d;font-size:11px}.meta{margin:15px 0;color:#665a6d}.summary{margin:14px 0;padding:11px 13px;border:1px solid #e6ddea;border-radius:8px;background:#faf7fb;color:#2d183b;white-space:pre-wrap}table{width:100%;border-collapse:collapse;table-layout:auto}thead{display:table-header-group}tr{break-inside:avoid}th,td{padding:8px 9px;border-bottom:1px solid #e9e3eb;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#f7f3f8;color:#603477;font-size:9px;text-transform:uppercase;letter-spacing:.07em}.empty{text-align:center;color:#665a6d;padding:24px}.foot{margin-top:18px;color:#807687;font-size:9px}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
    </style></head><body><header><img src="/images/logo.png" alt=""><div><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}</div></header><p class="meta">Associação BaticAmigo · Gerado em ${escapeHtml(new Intl.DateTimeFormat("pt-PT", { dateStyle: "long", timeZone: "Europe/Lisbon" }).format(new Date()))}</p>${summary ? `<div class="summary">${escapeHtml(summary)}</div>` : ""}<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table><p class="foot">Documento gerado a partir dos dados disponíveis ao seu perfil. Use a opção “Guardar como PDF” na janela de impressão.</p></body></html>`;
}

export function printReport(report) {
  if (typeof window === "undefined") return false;
  const printWindow = window.open("", "_blank", "popup,width=1000,height=760");
  if (!printWindow) {
    window.alert("Permita a abertura da janela de impressão para guardar o PDF.");
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(buildPrintableReport(report));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 250);
  return true;
}
