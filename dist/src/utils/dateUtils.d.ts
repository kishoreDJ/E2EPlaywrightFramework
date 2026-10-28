/**
 * Date Formatter - Produces dates in the two formats required by
 * referral-services contracts: 'MM/dd/yyyy' (Program/ProgramPeriod dates)
 * and 'MM/dd/yyyy HH:mm:ss' (Referral order dates).
 */
export type DateFormatToken = 'MM/dd/yyyy' | 'MM/dd/yy' | 'dd/MM/yyyy' | 'dd/MM/yy' | 'yyyy-MM-dd' | 'yyyy/MM/dd' | 'dd MMM yyyy' | 'hh:mm aa' | 'HH:mm' | 'EEE, d MMM yyyy HH:mm:ss z' | 'custom';
/**
 * Format a date as MM/dd/yyyy.
 */
export declare function formatDate(date: Date): string;
/**
 * Format a date as MM/dd/yyyy HH:mm:ss.
 */
export declare function formatDateTime(date: Date): string;
/**
 * A date N days in the future/past, formatted as MM/dd/yyyy.
 * Useful for programExpirationDate / resetDate (negative daysOffset = past).
 */
export declare function dateOffset(daysOffset: number): string;
/**
 * A datetime N days/minutes in the future/past, formatted as MM/dd/yyyy HH:mm:ss.
 * Computed against America/New_York wall-clock time (the referral-services
 * database server's timezone), not the local machine's timezone, since
 * "orderCreatedDate must not be later than now" is validated against server time.
 */
export declare function dateTimeOffset(daysOffset: number, minutesOffset?: number): string;
/**
 * Returns a random Date between start and end (inclusive).
 * Pass the result to formatDate / formatDateTime as needed.
 */
export declare function randomDateInRange(start: Date, end: Date): Date;
/**
 * Duration between two dates broken down into days, hours, minutes, and seconds.
 * Result is always positive regardless of argument order.
 */
export declare function durationBetween(a: Date, b: Date): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
};
/**
 * Returns a new Date with the given units added (use negative values to subtract).
 */
export declare function addToDate(date: Date, delta: {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}): Date;
/**
 * Converts a date string from one format to another.
 * Pass 'custom' as either format token and supply the pattern in the
 * corresponding customFormat string (uses the same token keys as the
 * built-in formats — e.g. 'dd-MM-yyyy').
 */
export declare function convertDateTimeFormat(dateStr: string, fromFormat: DateFormatToken, toFormat: DateFormatToken, options?: {
    fromCustomFormat?: string;
    toCustomFormat?: string;
}): string;
//# sourceMappingURL=dateUtils.d.ts.map