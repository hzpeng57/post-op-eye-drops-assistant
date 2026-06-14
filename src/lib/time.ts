export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(localDate: string, days: number): string {
  const date = parseLocalDate(localDate);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}

export function parseClockTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatClockTime(minutesFromMidnight: number): string {
  const normalized = ((Math.round(minutesFromMidnight) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function localDateTimeToIso(localDate: string, minutesFromMidnight: number): string {
  const base = parseLocalDate(localDate);
  base.setMinutes(base.getMinutes() + Math.round(minutesFromMidnight));
  const offsetMinutes = -base.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const offsetMins = String(absOffset % 60).padStart(2, "0");
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  const hours = String(base.getHours()).padStart(2, "0");
  const minutes = String(base.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:00.000${offsetSign}${offsetHours}:${offsetMins}`;
}

export function minutesUntil(targetIso: string, now: Date = new Date()): number {
  return Math.ceil((new Date(targetIso).getTime() - now.getTime()) / 60000);
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
