import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import LogData from "./LogData";

class Server {
  private fastify: FastifyInstance;
  private logData: LogData;
  private port: number;

  private static readonly DEFAULT_SERVER_PORT: number = 1488;

  constructor(port: number | undefined) {
    this.fastify = Fastify({ logger: true });
    this.logData = new LogData();
    this.routes();
    this.port = port ?? Server.DEFAULT_SERVER_PORT;
    this.start(this.port);
  }

  private routes(): void {
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
