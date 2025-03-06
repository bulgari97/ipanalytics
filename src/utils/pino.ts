import pino from "pino";

class PinoLogger {
  private static instance: PinoLogger;
  private pino;

  private constructor() {
    this.pino = pino({
      transport: {
        target: "pino-pretty",
      },
      base: { pid: process.pid },
      timestamp: () => `,"time":"${new Date().toISOString()}"`, 
    });
  }

  static getInstance(): PinoLogger {
    if (!PinoLogger.instance) {
      PinoLogger.instance = new PinoLogger();
    }
    return PinoLogger.instance;
  }

  log(config: { level?: LogLevel; method?: string; message?: string; error?: unknown }) {
    const { level = LogLevel.INFO, method = "", message = "", error } = config;
  
    const errorDetails = error instanceof Error ? { error: error.message, stack: error.stack } : { error };
  
    this.pino[level](`CheckIP - ${method} | ${message}`, error ? errorDetails : undefined);
  }
}

export default PinoLogger;