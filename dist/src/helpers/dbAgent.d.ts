export interface ColumnMeta {
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
}
export interface DbAgentConfig {
    databaseUrl: string;
    apiKey?: string;
    baseURL?: string;
    model?: string;
    maxPoolSize?: number;
    schemaNames?: string[];
}
export interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
    rowCount: number;
    sql: string;
}
export declare class DbAgent {
    private pool;
    private anthropic;
    private model;
    private schemaNames;
    private cachedSchema;
    constructor(config: DbAgentConfig);
    query<T = Record<string, unknown>>(naturalLanguageRequirement: string): Promise<QueryResult<T>>;
    rawQuery<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
    refreshSchema(): Promise<void>;
    close(): Promise<void>;
    private getSchema;
    private generateSql;
    private executeSelect;
}
export declare function getDbAgent(config?: Partial<DbAgentConfig>): DbAgent;
export declare function closeAllDbAgents(): Promise<void>;
//# sourceMappingURL=dbAgent.d.ts.map