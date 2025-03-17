import { createClient, RedisClientType } from "redis";
import PinoLogger from "./pino";


class Redis {
  protected port: number;
  protected host: string;
  protected password: string | undefined;

  protected client: RedisClientType;
  protected pino: PinoLogger;

  private static readonly DEFAULT_HOST = "localhost";
  private static readonly DEFAULT_PORT = 6379;

  constructor(config?: { host?: string, port?: number, password?: string }) {
    this.port = config?.port ?? Redis.DEFAULT_PORT;
    this.host = config?.host ?? Redis.DEFAULT_HOST;
    this.password = config?.password;

    this.client = createClient({
      url: `redis://${this.host}:${this.port}`,
      password: this.password ?? undefined, 
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
      if (error instanceof Error) {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "Redis.connect",
          error: error
        })
      } else {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "Redis.connect",
          message: "Error with connect to Redis"
        });
      }
    };
  }
}

export default Redis;