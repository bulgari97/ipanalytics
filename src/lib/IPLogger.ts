import Redis from "../utils/redis";
import RedisLogger from "./RedisLogger";
import { promises as fs } from "fs";
import { join } from "path";
import { FastifyReply, FastifyRequest } from "fastify";

class IPLogger extends Redis {
  private redisLogger: RedisLogger;
  private userBannedPage?: string;
  private static bannedPageCache: string | null = null;
  private logBannedRequests?: boolean;
 
  constructor(config?: { port?: number; host?: string }, settings?: { bannedPage?: string, ttlLOG?: number, ttlBAN?: number, logBannedRequests?: boolean }) {
    super(config);
    this.userBannedPage = settings?.bannedPage;
    this.logBannedRequests = settings?.logBannedRequests ?? false;
    
    RedisLogger.config(settings?.ttlLOG, settings?.ttlBAN)
    this.redisLogger = RedisLogger.getInstance();
  }

  async logVisit (req: FastifyRequest, res: FastifyReply): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"] || "Unknown";
      const ip =
        req.ip ||
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "0.0.0.0";
  
      const url = req.url

      if (!ip?.trim() || !userAgent) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "logVisit",
          message: "IP or User Agent is missing"
        });
        return;
      }

      const [bannedByUA, bannedByIP] = await Promise.all([
        this.redisLogger.isBannedByUA(userAgent),
        this.redisLogger.isBannedByIP(ip)
      ]);

      if (bannedByUA || bannedByIP) {
        if (this.logBannedRequests) {
          this.pino.log({
              level: LogLevel.WARN,
              method: "logVisit",
              message: `Blocked visit from ${ip} / ${userAgent}`
          });
        };

        const bannedPage = this.userBannedPage || (await this.getBannedPage());
        return res.status(403).header("Content-Type", "text/html").send(bannedPage);
      }

      await this.redisLogger.logVisit(ip, userAgent, url)
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "LogVisit",
        error: error
      });
      return;
    }
  }

  private async getBannedPage(): Promise<string> {
    if (IPLogger.bannedPageCache) return IPLogger.bannedPageCache;

    IPLogger.bannedPageCache = await fs.readFile(join(__dirname, "../web/pages/banned-page.html"),"utf-8");
    return IPLogger.bannedPageCache;
  }
}

export default IPLogger;