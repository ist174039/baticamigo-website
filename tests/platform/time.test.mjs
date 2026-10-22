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

test("one-week weekday recurrence preserves Lisbon wall-clock time across daylight saving changes", () => {
  const sessions = expandLisbonSessionRecurrence(lisbonDateTimeToIso("2027-03-21T18:00"), lisbonDateTimeToIso("2027-03-21T19:00"), "week", [7, 1]);
  assert.deepEqual(sessions.map(({ startsAt }) => lisbonDateTimeInput(startsAt)), ["2027-03-21T18:00", "2027-03-22T18:00"]);
  assert.equal(lisbonDateTimeInput(sessions[1].endsAt), "2027-03-22T19:00");
});

test("monthly weekday recurrence creates the selected weekdays within a calendar month", () => {
  const sessions = expandLisbonSessionRecurrence(lisbonDateTimeToIso("2027-01-15T18:00"), lisbonDateTimeToIso("2027-01-15T19:00"), "month", [1, 3]);
  assert.equal(sessions.length, 8);
  assert.equal(lisbonDateTimeInput(sessions[0].startsAt), "2027-01-18T18:00");
  assert.equal(lisbonDateTimeInput(sessions.at(-1).startsAt), "2027-02-10T18:00");
});

test("year recurrence is bounded and only accepts unique ISO weekdays", () => {
  const start = lisbonDateTimeToIso("2028-02-29T18:00"), end = lisbonDateTimeToIso("2028-02-29T19:00");
  const sessions = expandLisbonSessionRecurrence(start, end, "year", [2]);
  assert.equal(sessions.length, 53);
  assert.equal(sessions.every(({ startsAt }) => new Date(startsAt).getUTCDay() === 2), true);
  assert.throws(() => expandLisbonSessionRecurrence(start, end, "year", [2, 2]), /dias da semana/);
  assert.throws(() => expandLisbonSessionRecurrence(start, end, "daily", [2]), /inválido/);
});
