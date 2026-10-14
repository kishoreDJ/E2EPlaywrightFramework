export declare class Logger {
    private readonly context;
    constructor(context: string);
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    debug(message: string): void;
    private log;
}
export declare const createLogger: (context: string) => Logger;
//# sourceMappingURL=logger.d.ts.map