/**
 * Date Formatter - Produces dates in the two formats required by
 * referral-services contracts: 'MM/dd/yyyy' (Program/ProgramPeriod dates)
 * and 'MM/dd/yyyy HH:mm:ss' (Referral order dates).
 */

export type DateFormatToken =
  | 'MM/dd/yyyy' | 'MM/dd/yy'
  | 'dd/MM/yyyy' | 'dd/MM/yy'
  | 'yyyy-MM-dd' | 'yyyy/MM/dd'
  | 'dd MMM yyyy'
  | 'hh:mm aa' | 'HH:mm'
  | 'EEE, d MMM yyyy HH:mm:ss z'
  | 'custom';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/**
 * Format a date as MM/dd/yyyy.
 */
export function formatDate(date: Date): string {
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}

/**
 * Format a date as MM/dd/yyyy HH:mm:ss.
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * A date N days in the future/past, formatted as MM/dd/yyyy.
 * Useful for programExpirationDate / resetDate (negative daysOffset = past).
 */
export function dateOffset(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDate(date);
}

/**
 * A datetime N days/minutes in the future/past, formatted as MM/dd/yyyy HH:mm:ss.
 * Computed against America/New_York wall-clock time (the referral-services
 * database server's timezone), not the local machine's timezone, since
 * "orderCreatedDate must not be later than now" is validated against server time.
 */
export function dateTimeOffset(daysOffset: number, minutesOffset: number = 0): string {
  const nyNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  nyNow.setDate(nyNow.getDate() + daysOffset);
  nyNow.setMinutes(nyNow.getMinutes() + minutesOffset);
  return formatDateTime(nyNow);
}

/**
 * Returns a random Date between start and end (inclusive).
 * Pass the result to formatDate / formatDateTime as needed.
 */
export function randomDateInRange(start: Date, end: Date): Date {
  const ms = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(ms);
}

/**
 * Duration between two dates broken down into days, hours, minutes, and seconds.
 * Result is always positive regardless of argument order.
 */
export function durationBetween(
  a: Date,
  b: Date,
): { days: number; hours: number; minutes: number; seconds: number; totalMs: number } {
  const totalMs = Math.abs(b.getTime() - a.getTime());
  let remaining = totalMs;
  const days    = Math.floor(remaining / 86_400_000); remaining %= 86_400_000;
  const hours   = Math.floor(remaining /  3_600_000); remaining %=  3_600_000;
  const minutes = Math.floor(remaining /     60_000); remaining %=     60_000;
  const seconds = Math.floor(remaining /      1_000);
  return { days, hours, minutes, seconds, totalMs };
}

/**
 * Returns a new Date with the given units added (use negative values to subtract).
 */
export function addToDate(
  date: Date,
  delta: { years?: number; months?: number; days?: number; hours?: number; minutes?: number; seconds?: number },
): Date {
  const d = new Date(date);
  if (delta.years)   d.setFullYear(d.getFullYear() + delta.years);
  if (delta.months)  d.setMonth(d.getMonth() + delta.months);
  if (delta.days)    d.setDate(d.getDate() + delta.days);
  if (delta.hours)   d.setHours(d.getHours() + delta.hours);
  if (delta.minutes) d.setMinutes(d.getMinutes() + delta.minutes);
  if (delta.seconds) d.setSeconds(d.getSeconds() + delta.seconds);
  return d;
}

function applyFormat(d: Date, fmt: string): string {
  const MM   = pad(d.getMonth() + 1);
  const dd   = pad(d.getDate());
  const yy   = String(d.getFullYear()).slice(-2);
  const yyyy = String(d.getFullYear());
  const HH   = pad(d.getHours());
  const mm   = pad(d.getMinutes());
  const ss   = pad(d.getSeconds());
  const hh   = pad(d.getHours() % 12 || 12);
  const aa   = d.getHours() < 12 ? 'AM' : 'PM';
  const mon  = MONTH_SHORT[d.getMonth()];
  const day  = DAY_SHORT[d.getDay()];
  const D    = String(d.getDate());

  switch (fmt) {
    case 'MM/dd/yyyy':                  return `${MM}/${dd}/${yyyy}`;
    case 'MM/dd/yy':                    return `${MM}/${dd}/${yy}`;
    case 'dd/MM/yyyy':                  return `${dd}/${MM}/${yyyy}`;
    case 'dd/MM/yy':                    return `${dd}/${MM}/${yy}`;
    case 'yyyy-MM-dd':                  return `${yyyy}-${MM}-${dd}`;
    case 'yyyy/MM/dd':                  return `${yyyy}/${MM}/${dd}`;
    case 'dd MMM yyyy':                 return `${dd} ${mon} ${yyyy}`;
    case 'hh:mm aa':                    return `${hh}:${mm} ${aa}`;
    case 'HH:mm':                       return `${HH}:${mm}`;
    case 'EEE, d MMM yyyy HH:mm:ss z':  return `${day}, ${D} ${mon} ${yyyy} ${HH}:${mm}:${ss} GMT`;
    default:                            throw new Error(`Unsupported format: "${fmt}"`);
  }
}

/**
 * Converts a date string from one format to another.
 * Pass 'custom' as either format token and supply the pattern in the
 * corresponding customFormat string (uses the same token keys as the
 * built-in formats — e.g. 'dd-MM-yyyy').
 */
export function convertDateTimeFormat(
  dateStr: string,
  fromFormat: DateFormatToken,
  toFormat: DateFormatToken,
  options?: { fromCustomFormat?: string; toCustomFormat?: string },
): string {
  const resolvedFrom = fromFormat === 'custom' ? (options?.fromCustomFormat ?? '') : fromFormat;
  const resolvedTo   = toFormat   === 'custom' ? (options?.toCustomFormat   ?? '') : toFormat;
  const d = parseDateByFormat(dateStr, resolvedFrom);
  return applyFormat(d, resolvedTo);
}

function parseDateByFormat(dateStr: string, fmt: string): Date {
  const p = dateStr.trim().split(/[\s/\-:,]+/);
  switch (fmt) {
    case 'MM/dd/yyyy': case 'MM/dd/yy': return new Date(+p[2], +p[0] - 1, +p[1]);
    case 'dd/MM/yyyy': case 'dd/MM/yy': return new Date(+p[2], +p[1] - 1, +p[0]);
    case 'yyyy-MM-dd': case 'yyyy/MM/dd': return new Date(+p[0], +p[1] - 1, +p[2]);
    case 'dd MMM yyyy': {
      const m = MONTH_SHORT.indexOf(p[1]);
      return new Date(+p[2], m, +p[0]);
    }
    default: {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) throw new Error(`Cannot parse "${dateStr}" with format "${fmt}"`);
      return d;
    }
  }
}
