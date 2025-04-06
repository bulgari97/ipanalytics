import { createClient, RedisClientType } from "redis";
import PinoLogger from "./pino";
import ConfigService from "../config/redis.config";
import config from "../config/config.json";

/**
 * Redis client wrapper with built-in configuration.
 * 
 * Example usage:
 * ```ts
 * const redis = new Redis();
 * ```
 */

class Redis {
  protected port: number;
  protected host: string;
  protected password: string | undefined;

  protected client: RedisClientType;
  protected pino: PinoLogger;

  private RECONNECT_ATTEMPTS: number = 0;

  /**
   * Initializes Redis client and attempts connection.
   * Subscribes to error and connect events.
   * 
   * @param config Optional Redis config: host, port, password
   */
  constructor(config?: Config) {
    const configService = new ConfigService(config);
    this.port = configService.port;
    this.host = configService.host;
    this.password = configService.password;

    this.pino = PinoLogger.getInstance();

    this.client = createClient({
      url: `redis://${this.host}:${this.port}`,
      password: this.password ?? undefined,
    });

    this.client.on("error", (error: unknown) => this.handleError(error));

    this.client.on("connect", () =>
      console.log("TEST | Connection established")
    );

    this.connect();
  }

   /**
   * Connects to Redis and handles retry on failure.
   * Uses config constants MAX_RECONNECT_ATTEMPTS and RECONNECT_DELAY_MS.
   * Resets reconnect attempts after success.
   * 
   * @private
   */
  private async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.RECONNECT_ATTEMPTS = 0;
    } catch (error: unknown) {
      this.handleError(error)

      if (this.RECONNECT_ATTEMPTS < config.MAX_RECONNECT_ATTEMPTS) {
        this.RECONNECT_ATTEMPTS++;
        this.pino.log({
          level: LogLevel.WARN,
          method: "Redis.connect",
          message: `Reconnect attempt ${this.RECONNECT_ATTEMPTS}...`,
        });

        setTimeout(() => this.connect(), config.RECONNECT_DELAY_MS);
      } else {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "Redis.connect",
          message: "Max reconnect attempts reached",
          error,
        });
      }
    }
  }

  private handleError(error: unknown) {
    this.pino.log({
      level: LogLevel.ERROR,
      method: "Redis",
      message: "Error with connect to Redis",
      error,
    });
  }
}

export default Redis;
