import { test } from "node:test";
import assert from "node:assert/strict";
import { expandLisbonSessionRecurrence, lisbonDateTimeInput, lisbonDateTimeToIso } from "../../lib/platform/time.mjs";

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

test("weekly recurrence preserves Lisbon wall-clock time across daylight saving changes", () => {
  const sessions = expandLisbonSessionRecurrence(lisbonDateTimeToIso("2027-03-21T18:00"), lisbonDateTimeToIso("2027-03-21T19:00"), "weekly", 3);
  assert.deepEqual(sessions.map(({ startsAt }) => lisbonDateTimeInput(startsAt)), ["2027-03-21T18:00", "2027-03-28T18:00", "2027-04-04T18:00"]);
});

test("monthly recurrence keeps the same day and rejects dates absent from a month", () => {
  assert.deepEqual(expandLisbonSessionRecurrence(lisbonDateTimeToIso("2027-01-15T18:00"), lisbonDateTimeToIso("2027-01-15T19:00"), "monthly", 3).map(({ startsAt }) => lisbonDateTimeInput(startsAt).slice(0, 10)), ["2027-01-15", "2027-02-15", "2027-03-15"]);
  assert.throws(() => expandLisbonSessionRecurrence(lisbonDateTimeToIso("2027-01-31T18:00"), lisbonDateTimeToIso("2027-01-31T19:00"), "monthly", 3), /não existe/);
});

test("session recurrence is bounded to 52 occurrences and supported frequencies", () => {
  const start = lisbonDateTimeToIso("2027-01-15T18:00"), end = lisbonDateTimeToIso("2027-01-15T19:00");
  assert.equal(expandLisbonSessionRecurrence(start, end, "weekly", 52).length, 52);
  assert.throws(() => expandLisbonSessionRecurrence(start, end, "weekly", 53), /1 e 52/);
  assert.throws(() => expandLisbonSessionRecurrence(start, end, "daily", 3), /inválido/);
});
