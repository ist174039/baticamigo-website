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

/** Creates a bounded weekday schedule while preserving Lisbon wall-clock times across DST. */
export function expandLisbonSessionRecurrence(startsAt, endsAt, period, weekdays) {
  if (!['week', 'month', 'year'].includes(period)) throw new Error("Período de repetição inválido.");
  if (!Array.isArray(weekdays) || weekdays.length < 1 || weekdays.length > 7 || weekdays.some(day => !Number.isInteger(day) || day < 1 || day > 7) || new Set(weekdays).size !== weekdays.length) throw new Error("Escolha um ou mais dias da semana.");
  const startLocal = lisbonDateTimeInput(startsAt);
  const endLocal = lisbonDateTimeInput(endsAt);
  const startDate = startLocal.slice(0, 10);
  const sessionEndDate = endLocal.slice(0, 10);
  const startClock = startLocal.slice(11);
  const endClock = endLocal.slice(11);
  const [yearText, monthText, dayText] = startDate.split('-');
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const rangeEndDate = new Date(Date.UTC(year, month - 1, 1));
  if (period === 'week') {
    rangeEndDate.setUTCDate(day + 7);
  } else {
    rangeEndDate.setUTCFullYear(year + (period === 'year' ? 1 : 0));
    rangeEndDate.setUTCMonth(month - 1 + (period === 'month' ? 1 : 0));
    const lastDay = new Date(Date.UTC(rangeEndDate.getUTCFullYear(), rangeEndDate.getUTCMonth() + 1, 0)).getUTCDate();
    rangeEndDate.setUTCDate(Math.min(day, lastDay));
  }
  const rangeEnd = rangeEndDate.toISOString().slice(0, 10);
  const selectedDays = new Set(weekdays);
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  while (cursor.toISOString().slice(0, 10) < rangeEnd) {
    const isoWeekday = cursor.getUTCDay() || 7;
    if (selectedDays.has(isoWeekday)) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  if (!dates.length || dates.length > 366) throw new Error("O período tem de gerar entre 1 e 366 sessões.");

  return dates.map(occurrenceDate => {
    const offsetDays = Math.round((Date.parse(`${sessionEndDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000);
    const occurrenceEndDate = new Date(`${occurrenceDate}T00:00:00Z`);
    occurrenceEndDate.setUTCDate(occurrenceEndDate.getUTCDate() + offsetDays);
    const startsAtIso = lisbonDateTimeToIso(`${occurrenceDate}T${startClock}`);
    const endsAtIso = lisbonDateTimeToIso(`${occurrenceEndDate.toISOString().slice(0, 10)}T${endClock}`);
    if (Date.parse(endsAtIso) <= Date.parse(startsAtIso)) throw new Error("A duração da sessão deixa de ser válida numa das datas repetidas.");
    return { startsAt: startsAtIso, endsAt: endsAtIso };
  });
}
