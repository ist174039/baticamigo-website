const TIME_ZONE = "Europe/Lisbon";
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function localParts(date) {
  const parts = Object.fromEntries(formatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function wallClockAsUtc(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Indique uma data e hora válidas.");
  const [, year, month, day, hour, minute] = match.map(Number);
  const timestamp = Date.UTC(year, month - 1, day, hour, minute);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute) {
    throw new Error("Indique uma data e hora válidas.");
  }
  return timestamp;
}

function offsetAt(timestamp) {
  const minute = Math.floor(timestamp / 60_000) * 60_000;
  const localAsUtc = wallClockAsUtc(localParts(new Date(minute)));
  return localAsUtc - minute;
}

export function lisbonDateTimeToIso(value) {
  const wallClock = wallClockAsUtc(value);
  const offsets = new Set([-36, -12, 0, 12, 36].map((hours) => offsetAt(wallClock + hours * 3_600_000)));
  const matches = [...offsets]
    .map((offset) => wallClock - offset)
    .filter((timestamp) => localParts(new Date(timestamp)) === value)
    .sort((a, b) => a - b);

  if (!matches.length) throw new Error("Esta hora não existe no fuso Europe/Lisbon devido à mudança de hora.");
  // During the autumn clock change the same local time occurs twice. Choose
  // the first occurrence consistently so the stored instant is deterministic.
  return new Date(matches[0]).toISOString();
}

export function lisbonDateTimeInput(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Data da sessão inválida.");
  return localParts(date);
}
