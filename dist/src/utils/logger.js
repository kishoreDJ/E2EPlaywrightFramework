"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.Logger = void 0;
const LEVEL_ORDER = { debug: 0, info: 1, warn: 2, error: 3 };
function activeLevel() {
    const env = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
    return LEVEL_ORDER[env] !== undefined ? env : 'info';
}
class Logger {
    constructor(context) {
        this.context = context;
    }
    info(message) { this.log('info', message); }
    warn(message) { this.log('warn', message); }
    error(message) { this.log('error', message); }
    debug(message) { this.log('debug', message); }
    log(level, message) {
        if (LEVEL_ORDER[level] < LEVEL_ORDER[activeLevel()])
            return;
        const ts = new Date().toISOString();
        const line = `[${ts}] [${level.toUpperCase()}] [${this.context}] ${message}`;
        if (level === 'error')
            console.error(line);
        else if (level === 'warn')
            console.warn(line);
        else
            console.log(line);
    }
}
exports.Logger = Logger;
const createLogger = (context) => new Logger(context);
exports.createLogger = createLogger;
