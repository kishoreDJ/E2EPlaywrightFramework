export declare function csmQuery<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
export declare function closeCsmDb(): Promise<void>;
/**
 * Returns N random distinct UUIDs for subscribers in the given subscription state.
 * Uses ORDER BY RANDOM() so results differ on every call.
 * @param stateId - subscription state (e.g. 5 = active)
 * @param count   - number of UUIDs to return (default 20)
 */
export declare function getRandomUuidsBySubscriptionState(stateId: number, count?: number): Promise<string[]>;
//# sourceMappingURL=csmDbHelper.d.ts.map