const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "12 Oct". Call only after mount, so the user's time zone is safe to use.
export function formatDay(iso: string) {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Calendar days ("2026-10-30") have no time or time zone: a departure is a day.
function parts(day: string): [number, number, number] {
  const [year, month, date] = day.split("-").map(Number);
  return [year, month - 1, date];
}

// Today on the person's own calendar.
export function localDay(now: number) {
  const date = new Date(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Whole days from one calendar day to another: "2026-10-23" to "2026-10-30" is 7.
// Counted on the calendar, so clock changes never shift it.
export function daysBetween(from: string, to: string) {
  return Math.round((Date.UTC(...parts(to)) - Date.UTC(...parts(from))) / 86_400_000);
}

// "Fri 30 Oct".
export function formatCalendarDay(day: string) {
  const [year, month, date] = parts(day);
  return `${WEEKDAYS[new Date(Date.UTC(year, month, date)).getUTCDay()]} ${date} ${MONTHS[month]}`;
}

// "Departs today", "Departs tomorrow", "Departs in 3 days"; null once it has left.
export function departureCountdown(departsOn: string, now: number) {
  const days = daysBetween(localDay(now), departsOn);
  if (days < 0) return null;
  if (days === 0) return "Departs today";
  if (days === 1) return "Departs tomorrow";
  return `Departs in ${days} days`;
}

// For the trip's own page: "Departs Fri 30 Oct · in 7 days", or "Departed Fri 23 Oct".
export function departureLine(departsOn: string, now: number) {
  const days = daysBetween(localDay(now), departsOn);
  const day = formatCalendarDay(departsOn);
  if (days < 0) return `Departed ${day}`;
  if (days === 0) return `Departs today, ${day}`;
  if (days === 1) return `Departs tomorrow, ${day}`;
  return `Departs ${day} · in ${days} days`;
}
