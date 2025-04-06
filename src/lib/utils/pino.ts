import pino from "pino";

type LogConfig = {
  level?: LogLevel;
  method?: string;
  message?: string;
  error?: unknown;
};

class PinoLogger {
  private static instance: PinoLogger;
  private pino;
  
  static getInstance(): PinoLogger {
    if (!PinoLogger.instance) {
      PinoLogger.instance = new PinoLogger();
    }
    return PinoLogger.instance;
  }

  private constructor() {
    this.pino = this.createLogger();
  }

  private createLogger() {
    return pino(
      {
        transport: {
          target: "pino-pretty",
        },
        base: { pid: process.pid },
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
      },
    );
  }

  /**
   * 
   * @example
   * const logger = PinoLogger.getInstance();
   * 
   * logger.log({
      level: LogLevel.ERROR,
      method: "Redis",
      message: "Error with connect to Redis",
      error,
    });
 */
  log(config: LogConfig) {
    const { level = LogLevel.INFO, method = "", message = "", error } = config;
    const errorDetails = error instanceof Error ? { error: error.message, stack: error.stack } : { error };

    this.pino[level](`IPAnalytics - ${method} | ${message}`, error ? errorDetails : undefined);
  }
}

export default PinoLogger;
