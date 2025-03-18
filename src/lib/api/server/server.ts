import Fastify, { FastifyInstance } from "fastify";
import PinoLogger from "../../utils/pino";
import Routes from "./routes";

class Server {
  private fastify: FastifyInstance;
  private port: number;
  protected pino: PinoLogger;
  
  private static instance: Server;
  private static readonly DEFAULT_SERVER_PORT: number = 7649;

  public getURL(): string {
    return `http://localhost:${this.port}`;
  }

  public static getInstance(port?: number): Server {
    if (!Server.instance) {
      Server.instance = new Server(port);
    }
    return Server.instance;
  }

  private constructor(port?: number | undefined) {
    this.fastify = Fastify({ logger: true });
    this.port = port ?? Server.DEFAULT_SERVER_PORT;
    this.pino = PinoLogger.getInstance();

    new Routes(this.fastify); 
    this.start(this.port);
  }

  private async start(port: number): Promise<void> {
    try {
      await this.fastify.listen({ port });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "Server",
          error: error
        })
      } else {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "Server",
          message: `Error to connect to fastify server. PORT: ${port}`
        });
      }
      process.exit(1);
    }
  }
}

export default Server;
