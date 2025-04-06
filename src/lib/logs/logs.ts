// enum LogLevel {
//     DEBUG,
//     INFO,
//     ERROR,
//     CRITICAL,
//   }
  
  abstract class Logger {
    protected nextLogger: Logger | null = null;
  
    constructor(protected level: LogLevel) {}
  
    setNext(logger: Logger): Logger {
      this.nextLogger = logger;
      return logger; // для цепочки в одну строку
    }
  
    handle(level: LogLevel, message: string): void {
      if (this.canHandle(level)) {
        this.log(message);
      }
  
      if (this.nextLogger) {
        this.nextLogger.handle(level, message);
      }
    }
  
    protected abstract canHandle(level: LogLevel): boolean;
    protected abstract log(message: string): void;
  }
  
  class FileLogger extends Logger {
    constructor() {
      super(LogLevel.CRITICAL);
    }
  
    protected canHandle(level: LogLevel): boolean {
      return level === LogLevel.CRITICAL;
    }
  
    protected log(message: string): void {
      // Имитируем запись в файл
      console.log(`[FILE][CRITICAL] ${message}`);
    }
  }
  
  class ConsoleLogger extends Logger {
    constructor() {
      super(LogLevel.INFO);
    }
  
    protected canHandle(level: LogLevel): boolean {
      return level === LogLevel.INFO;
    }
  
    protected log(message: string): void {
      console.log(`[CONSOLE][INFO] ${message}`);
    }
  }
  
  class DebugLogger extends Logger {
    constructor() {
      super(LogLevel.DEBUG);
    }
  
    protected canHandle(level: LogLevel): boolean {
      return level === LogLevel.DEBUG;
    }
  
    protected log(message: string): void {
      console.log(`[DEBUG] ${message}`);
    }
  }
  
  // -----------------------
  // Использование
  
  const debugLogger = new DebugLogger();
  const consoleLogger = new ConsoleLogger();
  const fileLogger = new FileLogger();
  
  // Собираем цепочку
  debugLogger.setNext(consoleLogger).setNext(fileLogger);
  
  // Тестим логирование
  debugLogger.handle(LogLevel.DEBUG, "Отладочная информация");
  debugLogger.handle(LogLevel.INFO, "Информационное сообщение");
  debugLogger.handle(LogLevel.CRITICAL, "Критическая ошибка!");
  