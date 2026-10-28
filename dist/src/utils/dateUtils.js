"use strict";
/**
 * Date Formatter - Produces dates in the two formats required by
 * referral-services contracts: 'MM/dd/yyyy' (Program/ProgramPeriod dates)
 * and 'MM/dd/yyyy HH:mm:ss' (Referral order dates).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.dateOffset = dateOffset;
exports.dateTimeOffset = dateTimeOffset;
exports.randomDateInRange = randomDateInRange;
exports.durationBetween = durationBetween;
exports.addToDate = addToDate;
exports.convertDateTimeFormat = convertDateTimeFormat;
function pad(value) {
    return String(value).padStart(2, '0');
}
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/**
 * Format a date as MM/dd/yyyy.
 */
function formatDate(date) {
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}
/**
 * Format a date as MM/dd/yyyy HH:mm:ss.
 */
function formatDateTime(date) {
    return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
/**
 * A date N days in the future/past, formatted as MM/dd/yyyy.
 * Useful for programExpirationDate / resetDate (negative daysOffset = past).
 */
function dateOffset(daysOffset) {
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
function dateTimeOffset(daysOffset, minutesOffset = 0) {
    const nyNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    nyNow.setDate(nyNow.getDate() + daysOffset);
    nyNow.setMinutes(nyNow.getMinutes() + minutesOffset);
    return formatDateTime(nyNow);
}
/**
 * Returns a random Date between start and end (inclusive).
 * Pass the result to formatDate / formatDateTime as needed.
 */
function randomDateInRange(start, end) {
    const ms = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(ms);
}
/**
 * Duration between two dates broken down into days, hours, minutes, and seconds.
 * Result is always positive regardless of argument order.
 */
function durationBetween(a, b) {
    const totalMs = Math.abs(b.getTime() - a.getTime());
    let remaining = totalMs;
    const days = Math.floor(remaining / 86400000);
    remaining %= 86400000;
    const hours = Math.floor(remaining / 3600000);
    remaining %= 3600000;
    const minutes = Math.floor(remaining / 60000);
    remaining %= 60000;
    const seconds = Math.floor(remaining / 1000);
    return { days, hours, minutes, seconds, totalMs };
}
/**
 * Returns a new Date with the given units added (use negative values to subtract).
 */
function addToDate(date, delta) {
    const d = new Date(date);
    if (delta.years)
        d.setFullYear(d.getFullYear() + delta.years);
    if (delta.months)
        d.setMonth(d.getMonth() + delta.months);
    if (delta.days)
        d.setDate(d.getDate() + delta.days);
    if (delta.hours)
        d.setHours(d.getHours() + delta.hours);
    if (delta.minutes)
        d.setMinutes(d.getMinutes() + delta.minutes);
    if (delta.seconds)
        d.setSeconds(d.getSeconds() + delta.seconds);
    return d;
}
function applyFormat(d, fmt) {
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const yy = String(d.getFullYear()).slice(-2);
    const yyyy = String(d.getFullYear());
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const hh = pad(d.getHours() % 12 || 12);
    const aa = d.getHours() < 12 ? 'AM' : 'PM';
    const mon = MONTH_SHORT[d.getMonth()];
    const day = DAY_SHORT[d.getDay()];
    const D = String(d.getDate());
    switch (fmt) {
        case 'MM/dd/yyyy': return `${MM}/${dd}/${yyyy}`;
        case 'MM/dd/yy': return `${MM}/${dd}/${yy}`;
        case 'dd/MM/yyyy': return `${dd}/${MM}/${yyyy}`;
        case 'dd/MM/yy': return `${dd}/${MM}/${yy}`;
        case 'yyyy-MM-dd': return `${yyyy}-${MM}-${dd}`;
        case 'yyyy/MM/dd': return `${yyyy}/${MM}/${dd}`;
        case 'dd MMM yyyy': return `${dd} ${mon} ${yyyy}`;
        case 'hh:mm aa': return `${hh}:${mm} ${aa}`;
        case 'HH:mm': return `${HH}:${mm}`;
        case 'EEE, d MMM yyyy HH:mm:ss z': return `${day}, ${D} ${mon} ${yyyy} ${HH}:${mm}:${ss} GMT`;
        default: throw new Error(`Unsupported format: "${fmt}"`);
    }
}
/**
 * Converts a date string from one format to another.
 * Pass 'custom' as either format token and supply the pattern in the
 * corresponding customFormat string (uses the same token keys as the
 * built-in formats — e.g. 'dd-MM-yyyy').
 */
function convertDateTimeFormat(dateStr, fromFormat, toFormat, options) {
    const resolvedFrom = fromFormat === 'custom' ? (options?.fromCustomFormat ?? '') : fromFormat;
    const resolvedTo = toFormat === 'custom' ? (options?.toCustomFormat ?? '') : toFormat;
    const d = parseDateByFormat(dateStr, resolvedFrom);
    return applyFormat(d, resolvedTo);
}
function parseDateByFormat(dateStr, fmt) {
    const p = dateStr.trim().split(/[\s/\-:,]+/);
    switch (fmt) {
        case 'MM/dd/yyyy':
        case 'MM/dd/yy': return new Date(+p[2], +p[0] - 1, +p[1]);
        case 'dd/MM/yyyy':
        case 'dd/MM/yy': return new Date(+p[2], +p[1] - 1, +p[0]);
        case 'yyyy-MM-dd':
        case 'yyyy/MM/dd': return new Date(+p[0], +p[1] - 1, +p[2]);
        case 'dd MMM yyyy': {
            const m = MONTH_SHORT.indexOf(p[1]);
            return new Date(+p[2], m, +p[0]);
        }
        default: {
            const d = new Date(dateStr);
            if (isNaN(d.getTime()))
                throw new Error(`Cannot parse "${dateStr}" with format "${fmt}"`);
            return d;
        }
    }
}
