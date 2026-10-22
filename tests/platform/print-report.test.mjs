import test from "node:test";
import assert from "node:assert/strict";
import { buildPrintableReport } from "../../lib/platform/print-report.mjs";

test("builds a printable table and escapes untrusted content", () => {
  const html = buildPrintableReport({
    title: "Lista <alunos>",
    columns: ["Nome", "Estado"],
    rows: [["Ana & Rui", "Ativo"], ["<script>alert(1)</script>", "Inativo"]],
  });
  assert.match(html, /Lista &lt;alunos&gt;/);
  assert.match(html, /Ana &amp; Rui/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /Guardar como PDF/);
  assert.doesNotMatch(html, /<script>/);
});

test("prints a safe empty state and supports portrait reports", () => {
  const html = buildPrintableReport({ title: "Evolução", columns: ["Disciplina"], rows: [], orientation: "portrait" });
  assert.match(html, /A4 portrait/);
  assert.match(html, /Sem registos para apresentar/);
});
