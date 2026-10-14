/**
 * Collision-safe value generators for parallel test runs.
 * Avoids hardcoded literals (codePrefix, orderNumber, emails) colliding
 * across the 50+ concurrent tests the browser/REST fixtures are built for.
 */
/**
 * Short unique suffix safe for fields with length limits (e.g. codePrefix <= 10 chars).
 */
export declare function uniqueSuffix(length?: number): string;
export declare function uniqueEmail(domain?: string): string;
export declare function uniqueOrderNumber(prefix?: string): string;
export declare function uniqueCodePrefix(prefix?: string): string;
//# sourceMappingURL=unique.d.ts.map