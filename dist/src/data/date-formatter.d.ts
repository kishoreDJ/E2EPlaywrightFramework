/**
 * Date Formatter - Produces dates in the two formats required by
 * referral-services contracts: 'MM/dd/yyyy' (Program/ProgramPeriod dates)
 * and 'MM/dd/yyyy HH:mm:ss' (Referral order dates).
 */
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
//# sourceMappingURL=date-formatter.d.ts.map