import { test } from "node:test";
import assert from "node:assert/strict";
import { lisbonDateTimeInput, lisbonDateTimeToIso } from "../../lib/platform/time.mjs";

test("interprets session form times in Lisbon during winter and summer", () => {
  assert.equal(lisbonDateTimeToIso("2026-01-15T10:30"), "2026-01-15T10:30:00.000Z");
  assert.equal(lisbonDateTimeToIso("2026-07-15T10:30"), "2026-07-15T09:30:00.000Z");
});

test("chooses the first occurrence of an ambiguous Lisbon time consistently", () => {
  assert.equal(lisbonDateTimeToIso("2026-10-25T01:30"), "2026-10-25T00:30:00.000Z");
});

test("rejects a local time skipped by the spring clock change", () => {
  assert.throws(() => lisbonDateTimeToIso("2026-03-29T01:30"), /mudança de hora/);
});

test("formats existing session instants in Lisbon for editing", () => {
  assert.equal(lisbonDateTimeInput("2026-07-15T09:30:00.000Z"), "2026-07-15T10:30");
});
