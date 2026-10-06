/**
 * Date Formatter - Produces dates in the two formats required by
 * referral-services contracts: 'MM/dd/yyyy' (Program/ProgramPeriod dates)
 * and 'MM/dd/yyyy HH:mm:ss' (Referral order dates).
 */

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

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
