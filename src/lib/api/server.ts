import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import LogData from "./log-data";
import PinoLogger from "../utils/pino";
import BanService from "../ban/ban-service";
import Joi from "joi";

class Server {
  private fastify: FastifyInstance;
  private logData: LogData;
  private banService: BanService;
  private port: number;
  protected pino: PinoLogger;
  
  private static instance: Server;

  private static readonly DEFAULT_SERVER_PORT: number = 7649;
  private static readonly ALLOWED_IPS: string[] = ["127.0.0.1", "localhost"];

  public getURL(): string {
    return `http://localhost:${this.port}`
  }

  public static getInstance(port?: number): Server {
    if (!Server.instance) {
        Server.instance = new Server(port);
    }
    return Server.instance;
  }

  private constructor(port?: number | undefined) {
    this.fastify = Fastify({ logger: true });
    this.logData = new LogData();
    this.port = port ?? Server.DEFAULT_SERVER_PORT;

    this.routes();
    this.start(this.port);

    this.pino = PinoLogger.getInstance();
    this.banService = BanService.getInstance();
  }
  
  private routes(): void {
    this.fastify.addHook("onRequest", async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
      const clientIP: string = req.ip === "::1" ? "127.0.0.1" : req.ip;

      const schema: Joi.StringSchema = Joi.string().ip().required();
      const { error }: Joi.ValidationResult<string> = schema.validate(clientIP);

      if (error) {
        res.status(400).send({ error: "Invalid IP address" });
        return;
      }

      if (!Server.ALLOWED_IPS.includes(clientIP)) {
        res.status(403).send({ error: "Forbidden" });
        return;
      }
    });

    this.fastify.get("/getUAs", async (req: FastifyRequest<{ Querystring: { key: keyUAs, start: number, stop: number } }>, res: FastifyReply) => {
        const { key, start, stop } = req.query;
        const uas = await this.logData.getUAs(key, start, stop);
        return res.send(uas);
    });

    this.fastify.get("/getIPs", async (req: FastifyRequest<{ Querystring: { key: keyIPs, start: number, stop: number } }>, res: FastifyReply) => {
        const { key, start, stop } = req.query;
        const ips = await this.logData.getIPs(key, start, stop);
        return res.send(ips);
    });

    this.fastify.get("/getBANNED", async(req: FastifyRequest<{ Querystring: { key: keyBANNED, start: number, stop: number } }>, res: FastifyReply) => {
        const { key, start, stop } = req.query;
        const bannedArr = await this.logData.getBanned(key, start, stop);
        return res.send(bannedArr);
    });

    this.fastify.post("/banIP", async (req: FastifyRequest<{ Body: { ip: string } }>, res: FastifyReply) => {
      const { ip } = req.body;
      if (!ip) return res.status(400).send({ error: "IP is required" });
  
      await this.banService.banIP(ip);
      return res.status(200).send({ message: "IP banned" });
    });
  
    this.fastify.post("/banUA", async (req: FastifyRequest<{ Body: { ua: string } }>, res: FastifyReply) => {
      const { ua } = req.body;
      if (!ua) return res.status(400).send({ error: "UA is required" });
  
      await this.banService.banUA(ua);
      return res.status(200).send({ message: "UA banned" });
    });
  }

  private async start (port: number): Promise<void> {
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
