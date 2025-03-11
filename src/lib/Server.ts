import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import LogData from "./LogData";
import RedisLogger from "./RedisLogger";

class Server {
  private fastify: FastifyInstance;
  private logData: LogData;
  private redisLogger: RedisLogger;
  private port: number;

  private static readonly DEFAULT_SERVER_PORT: number = 7649;

  private static readonly ALLOWED_IPS: string[] = ["127.0.0.1", "localhost"];

  constructor(port: number | undefined) {
    this.fastify = Fastify({ logger: true });
    this.logData = new LogData();
    this.routes();
    this.port = port ?? Server.DEFAULT_SERVER_PORT;
    this.start(this.port);

    this.redisLogger = RedisLogger.getInstance();
  }
  
  private routes(): void {
    this.fastify.addHook("onRequest", async (req: FastifyRequest, res: FastifyReply) => {
      if (!Server.ALLOWED_IPS.includes(req.ip)) { 
          return res.status(403).send({ error: "Forbidden" });
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
  
      await this.redisLogger.banIP(ip);
      return res.status(200).send({ message: "IP banned" });
    });
  
    this.fastify.post("/banUA", async (req: FastifyRequest<{ Body: { ua: string } }>, res: FastifyReply) => {
      const { ua } = req.body;
      if (!ua) return res.status(400).send({ error: "UA is required" });
  
      await this.redisLogger.banUA(ua);
      return res.status(200).send({ message: "UA banned" });
    });
  }

  private start(port: number): void {
    this.fastify.listen({ port }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Server listening at ${address}`);
    });
  }
}

export default Server;
