/**
 * Identity Headers - Builds the 4 request-identity headers required by
 * every referral-services endpoint (validated by ValidateHeaders server-side).
 * Origin/Source-Application-Request-Identifier must be a fresh RFC 4122 UUID per request.
 */
export interface IdentityHeaderOptions {
    originAppName?: string;
    sourceAppName?: string;
    originRequestId?: string;
    sourceRequestId?: string;
}
export declare function buildIdentityHeaders(options?: IdentityHeaderOptions): Record<string, string>;
//# sourceMappingURL=identity-headers.d.ts.map