import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Joi from "joi";
import LogData from "../log-data";
import BanService from "../../ban/ban-service";

class Routes {
  private logData: LogData;
  private banService: BanService;
  private static readonly ALLOWED_IPS: string[] = ["127.0.0.1", "localhost"];

  constructor(fastify: FastifyInstance) {
    this.logData = new LogData();
    this.banService = BanService.getInstance();
    this.setupRoutes(fastify);
  }

  private setupRoutes(fastify: FastifyInstance): void {
    fastify.addHook("onRequest", async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
      const clientIP: string = req.ip === "::1" ? "127.0.0.1" : req.ip;

      const schema: Joi.StringSchema = Joi.string().ip().required();
      const { error }: Joi.ValidationResult<string> = schema.validate(clientIP);

      if (error) {
        res.status(400).send({ error: "Invalid IP address" });
        return;
      }

      if (!Routes.ALLOWED_IPS.includes(clientIP)) {
        res.status(403).send({ error: "Forbidden" });
        return;
      }
    });

    fastify.get("/getUAs", async (req: FastifyRequest<{ Querystring: { key: keyUAs; start: number; stop: number } }>, res: FastifyReply) => {
      const { key, start, stop } = req.query;
      const uas = await this.logData.getUAs(key, start, stop);
      return res.send(uas);
    });

    fastify.get("/getIPs", async (req: FastifyRequest<{ Querystring: { key: keyIPs; start: number; stop: number } }>, res: FastifyReply) => {
      const { key, start, stop } = req.query;
      const ips = await this.logData.getIPs(key, start, stop);
      return res.send(ips);
    });

    fastify.get("/getBANNED", async (req: FastifyRequest<{ Querystring: { key: keyBANNED; start: number; stop: number } }>, res: FastifyReply) => {
      const { key, start, stop } = req.query;
      const bannedArr = await this.logData.getBanned(key, start, stop);
      return res.send(bannedArr);
    });

    fastify.post("/banIP", async (req: FastifyRequest<{ Body: { ip: string } }>, res: FastifyReply) => {
      const { ip } = req.body;
      if (!ip) return res.status(400).send({ error: "IP is required" });

      await this.banService.banIP(ip);
      return res.status(200).send({ message: "IP banned" });
    });

    fastify.post("/banUA", async (req: FastifyRequest<{ Body: { ua: string } }>, res: FastifyReply) => {
      const { ua } = req.body;
      if (!ua) return res.status(400).send({ error: "UA is required" });

      await this.banService.banUA(ua);
      return res.status(200).send({ message: "UA banned" });
    });
  }
}

export default Routes;
