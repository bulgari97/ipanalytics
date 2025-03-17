import Redis from "../utils/redis";
import LogService from "./log-service";
import { promises as fs } from "fs";
import { join } from "path";
import { FastifyReply, FastifyRequest } from "fastify";
import BanService from "../ban/ban-service";

class IPLogger extends Redis {
  private logService: LogService;
  private banService: BanService;
  private userBannedPage?: string;
  private static bannedPageCache: string | null = null;
  private logBannedRequests?: boolean;
 
  constructor(config?: { port?: number; host?: string; password?: string }, settings?: { bannedPage?: string, ttlLOG?: number, ttlBAN?: number, logBannedRequests?: boolean }) {
    super(config);
    this.userBannedPage = settings?.bannedPage;
    this.logBannedRequests = settings?.logBannedRequests ?? false;
    
    this.logService = LogService.getInstance(settings?.ttlLOG)
    this.banService = BanService.getInstance(settings?.ttlBAN)
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
          method: "IPLogger",
          message: "IP or User Agent is missing"
        });
        return;
      }

      const [bannedByUA, bannedByIP] = await Promise.all([
        this.banService.isBannedByUA(userAgent),
        this.banService.isBannedByIP(ip)
      ]);

      if (bannedByUA || bannedByIP) {
        if (this.logBannedRequests) {
          this.pino.log({
              level: LogLevel.WARN,
              method: "IPAnalytics",
              message: `Blocked visit from ${ip} / ${userAgent}`
          });
        };

        const bannedPage = this.userBannedPage || (await this.getBannedPage());
        return res.status(403).header("Content-Type", "text/html").send(bannedPage);
      }

      await this.logService.logVisit(ip, userAgent, url)
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "IPLogger.logVisit",
          error: error
        })
      } else {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "IPLogger.logVisit",
          message: "Error with logging visit"
        });
      }
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