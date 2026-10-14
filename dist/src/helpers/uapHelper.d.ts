export interface UapUser {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
}
export declare function getUapToken(): Promise<string>;
/**
 * Fetches user details from UAP for all given UUIDs in parallel.
 * Skips UUIDs that fail (not in UAP, offline users, 5xx errors).
 * Only returns primary-realm users with a real emailAddress.
 */
export declare function getUsersByUuids(uuids: string[]): Promise<UapUser[]>;
/**
 * Convenience: fetch a single user by UUID.
 */
export declare function getUserByUuid(uuid: string): Promise<UapUser | null>;
//# sourceMappingURL=uapHelper.d.ts.map