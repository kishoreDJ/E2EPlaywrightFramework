/**
 * Generates standard request headers required by all APIs.
 * Values are read from .env — override per request if needed.
 *
 * Required .env variables:
 *   ORIGIN_APP_NAME  - Name of the origin application
 *   SOURCE_APP_NAME  - Name of the source application
 */
export declare function getStandardHeaders(token: string): Record<string, string>;
export declare function getDeleteHeaders(token: string): Record<string, string>;
//# sourceMappingURL=requestHeaders.d.ts.map