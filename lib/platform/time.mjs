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

function dateAtMonthOffset(year, month, day, offset) {
  const targetMonth = new Date(Date.UTC(year, month - 1 + offset, 1));
  const date = new Date(Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), day));
  if (date.getUTCDate() !== day) throw new Error("O dia escolhido não existe num dos meses da repetição. Escolha um dia até 28 ou altere a data inicial.");
  return date.toISOString().slice(0, 10);
}

/** Creates bounded occurrences while preserving Lisbon wall-clock times across DST. */
export function expandLisbonSessionRecurrence(startsAt, endsAt, frequency, count) {
  if (!Number.isInteger(count) || count < 1 || count > 52) throw new Error("Escolha entre 1 e 52 ocorrências.");
  if (!['weekly', 'monthly'].includes(frequency)) throw new Error("Tipo de repetição inválido.");

  const startLocal = lisbonDateTimeInput(startsAt);
  const endLocal = lisbonDateTimeInput(endsAt);
  const startDate = startLocal.slice(0, 10);
  const endDate = endLocal.slice(0, 10);
  const startClock = startLocal.slice(11);
  const endClock = endLocal.slice(11);
  const [, yearText, monthText, dayText] = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);

  return Array.from({ length: count }, (_, index) => {
    let occurrenceDate;
    if (frequency === 'weekly') {
      const date = new Date(`${startDate}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + index * 7);
      occurrenceDate = date.toISOString().slice(0, 10);
    } else {
      occurrenceDate = dateAtMonthOffset(year, month, day, index);
    }
    const offsetDays = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000);
    const occurrenceEndDate = new Date(`${occurrenceDate}T00:00:00Z`);
    occurrenceEndDate.setUTCDate(occurrenceEndDate.getUTCDate() + offsetDays);
    const startsAtIso = lisbonDateTimeToIso(`${occurrenceDate}T${startClock}`);
    const endsAtIso = lisbonDateTimeToIso(`${occurrenceEndDate.toISOString().slice(0, 10)}T${endClock}`);
    if (Date.parse(endsAtIso) <= Date.parse(startsAtIso)) throw new Error("A duração da sessão deixa de ser válida numa das datas repetidas.");
    return { startsAt: startsAtIso, endsAt: endsAtIso };
  });
}
