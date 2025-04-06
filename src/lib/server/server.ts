import Fastify, { FastifyInstance } from "fastify";
import PinoLogger from "../utils/pino";
import Routes from "./routes";
import config from "../config/config.json";

/**
 * Singleton Fastify server with reconnect logic.
 */
class Server {
  private fastify: FastifyInstance;
  private port: number;
  protected pino: PinoLogger;

  private RECONNECT_ATTEMPTS: number = 0;

  private static instance: Server;

   /**
   * Returns single instance of Server.
   * @param port - Optional custom port.
   * @param useTrustProxy - Enable trust proxy.
   */
  public static getInstance(port?: number, useTrustProxy?: boolean): Server {
    if (!Server.instance) {
      Server.instance = new Server(port, useTrustProxy);
    }
    return Server.instance;
  }

  /** Returns server URL string. */
  public getURL(): string {
    return `http://localhost:${this.port}`;
  }

  private constructor(
    port?: number | undefined,
    useTrustProxy: boolean = config.USE_TRUST_PROXY
  ) {
    this.fastify = Fastify({ logger: true, trustProxy: useTrustProxy });
    this.port = port ?? config.DEFAULT_SERVER_PORT;
    this.pino = PinoLogger.getInstance();

    new Routes(this.fastify);
    this.start(this.port);
  }

  private async start(port: number): Promise<void> {
    try {
      await this.fastify.listen({ port });
      this.RECONNECT_ATTEMPTS = 0;
      this.pino.log({
        level: LogLevel.INFO,
        method: "Server.connect",
        message: `Server started at http://localhost:${port}`,
      });
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "Server.connect",
        message: `Error to connect to fastify server. PORT: ${port}`,
        error,
      });

      if (this.RECONNECT_ATTEMPTS < config.MAX_RECONNECT_ATTEMPTS) {
        this.RECONNECT_ATTEMPTS++;
        this.pino.log({
          level: LogLevel.WARN,
          method: "Server.connect",
          message: `Reconnect attempt ${this.RECONNECT_ATTEMPTS}...`,
        });

        setTimeout(() => this.start(this.port), config.RECONNECT_DELAY_MS);
      } else {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "Server.connect",
          message: "Max reconnect attempts reached",
          error,
        });

        process.exit(1);
      }
    }
  }
}

export default Server;
