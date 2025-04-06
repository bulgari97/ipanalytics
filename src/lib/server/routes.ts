import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Joi from "joi";
import LogData from "../services/log-data.service";
import BanService from "../services/ban.service";
import config from '../config/config.json';
import { getClientIP } from "../index";

/**
 * Registers API routes and request hooks.
 */
class Routes {
  private logData: LogData;
  private banService: BanService;

  /**
   * Initializes routes on Fastify instance.
   * @param fastify - Fastify app instance.
   */
  constructor(fastify: FastifyInstance) {
    this.logData = new LogData();
    this.banService = BanService.getInstance();
    this.setupRoutes(fastify);
  }

  /** Defines all routes and request hooks. */
  private setupRoutes(fastify: FastifyInstance): void {
    fastify.addHook("onRequest", async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
      const ip: string = getClientIP(req);
      const clientIP: string = ip === "::1" ? "127.0.0.1" : ip;

      const schema = Joi.string().ip().required();
      const { error } = schema.validate(clientIP);

      if (error) {
        res.status(400).send({ error: "Invalid IP address" });
        return;
      }

      if (!config.ALLOWED_IPS.includes(clientIP)) {
        res.status(403).send({ error: "Forbidden" });
        return;
      }
    });

    // Get data
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


    // Manage bans
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
