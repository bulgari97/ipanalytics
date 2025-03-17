import pino from "pino";
import { mkdirSync, unlinkSync, existsSync } from "fs";

class PinoLogger {
  private static instance: PinoLogger;
  private pino;
  private logCount: number = 0;
  private logFilePath: string = "logs/app.log";

  private constructor() {
    /* 
      COMMENT THE LINE BELOW TO OUTPUT TO CONSOLE
    */
    mkdirSync("logs", { recursive: true });
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
      /* 
        COMMENT THE LINE BELOW TO OUTPUT TO CONSOLE
      */
      pino.destination(this.logFilePath)
    );
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

    this.pino[level](`IPAnalytics - ${method} | ${message}`, error ? errorDetails : undefined);

    this.logCount++;
    if (this.logCount >= 100) {
      this.rotateLogFile();
    }
  }

  private rotateLogFile() {
    if (existsSync(this.logFilePath)) {
      unlinkSync(this.logFilePath); // Удаляем старый лог-файл
    }
    this.pino = this.createLogger(); // Создаем новый логгер с новым файлом
    this.logCount = 0; // Сбрасываем счетчик
  }
}

export default PinoLogger;
