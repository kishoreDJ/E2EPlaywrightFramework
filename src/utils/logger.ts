type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function activeLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as LogLevel;
  return LEVEL_ORDER[env] !== undefined ? env : 'info';
}

export class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string): void  { this.log('info',  message); }
  warn(message: string): void  { this.log('warn',  message); }
  error(message: string): void { this.log('error', message); }
  debug(message: string): void { this.log('debug', message); }

  private log(level: LogLevel, message: string): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[activeLevel()]) return;

    const ts = new Date().toISOString();
    const line = `[${ts}] [${level.toUpperCase()}] [${this.context}] ${message}`;

    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }
}

export const createLogger = (context: string): Logger => new Logger(context);
