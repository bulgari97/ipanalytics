import { createClient, RedisClientType } from "redis";
import PinoLogger from "./pino";


class Redis {
  protected user: string;
  protected password: string;
  protected port: number;
  protected host: string;
  protected client: RedisClientType;
  protected pino: PinoLogger;

  private static readonly DEFAULT_USER = "default";
  private static readonly DEFAULT_PASSWORD = "";
  private static readonly DEFAULT_HOST = "localhost";
  private static readonly DEFAULT_PORT = 1228;


  constructor(config?: {user?: string, password?: string, host?: string, port?: number}) {
    this.user = config?.user ?? Redis.DEFAULT_USER;
    this.password = config?.password ?? Redis.DEFAULT_PASSWORD;
    this.port = config?.port ?? Redis.DEFAULT_PORT;
    this.host = config?.host ?? Redis.DEFAULT_HOST;
    this.client = createClient({
      url: `redis://${this.user}:${this.password}@${this.host}:${this.port}`
    });

    this.pino = PinoLogger.getInstance();

    this.client.on("error", (error: unknown) => this.pino.log({
      level: LogLevel.ERROR, 
      method: "Redis", 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : { error }
    }));
    
    this.client.on("connect", () => console.log("TEST | Connection established"));

    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR, 
        method: "Redis", 
        error: error instanceof Error ? { message: error.message, stack: error.stack } : { error }
      })
    };
  }
}

export default Redis;