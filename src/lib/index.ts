import Redis from "./utils/redis";
import LogService from "./services/log.service";
import { promises as fs } from "fs";
import { join } from "path";
import { FastifyReply, FastifyRequest } from "fastify";
import BanService from "./services/ban.service";
import config from "./config/config.json";
import CheckBanService from "./services/check-ban.service";
import Server from "./server/server";

interface Config {
  port?: number;
  host?: string;
  password?: string;
}

interface Settings {
  bannedPage?: string;
  ttlLOG?: number;
  ttlBAN?: number;
  port?: number;
  logBannedRequests?: boolean;
  useTrustProxy?: boolean;
}

/**
 *Lightweight IP/User-Agent logger and ban manager with Redis integration.
 */
class IPAnalytics extends Redis {
  private logService: LogService;
  private userBannedPage?: string;
  private static bannedPageCache: string | null = null;

  /**
   * Initializes the IPLogger with Redis configuration and optional logging/ban settings.
   *
   * @example
   * new IPAnalytics(
      {
        host: "localhost",
        port: 6379,
        password: "yourpass",
      },
      {
        bannedPage: "<h1>Access Denied</h1>",
        ttlLOG: 86400,
        ttlBAN: 604800,
        port: 3000,
        logBannedRequests: false,
        useTrustProxy: false
      }
    );
   *
   * @param config - Redis connection options (host, port, password).
   * @param settings - Optional settings including banned page HTML, TTL for logs and bans, and logging behavior.
   */
  constructor(config?: Config, settings?: Settings) {
    super(config);
    this.userBannedPage = settings?.bannedPage;

    this.logService = LogService.getInstance(settings?.ttlLOG);
    BanService.getInstance(settings?.ttlBAN);
    Server.getInstance(settings?.port, settings?.useTrustProxy)
  }

  /**
   * Handles an incoming request: logs visit or blocks if banned.
   *
   * @param req - request object.
   * @param res - response object.
   */
  async handle(
    req: FastifyRequest | any,
    res: FastifyReply | any
  ): Promise<void> {
    try {
      const userAgent: string = req.headers["user-agent"] || "Unknown";
      const ip: string = getClientIP(req);
      const url: string = req.url;

      if (!ip?.trim() || !userAgent) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "IPLogger",
          message: "IP or User Agent is missing",
        });
        return;
      }

      if (await isBanned(userAgent, ip)) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "IPAnalytics",
          message: `Blocked visit from ${ip} / ${userAgent}`,
        });

        const bannedPage: string =
          this.userBannedPage || (await this.getBannedPage());
        return res
          .status(403)
          .header("Content-Type", "text/html")
          .send(bannedPage);
      }

      await this.logService.logVisit(ip, userAgent, url);
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "IPLogger.logVisit",
        message: "Error with logging visit",
        error,
      });
      return;
    }
  }

  private async getBannedPage(): Promise<string> {
    if (IPAnalytics.bannedPageCache) return IPAnalytics.bannedPageCache;

    IPAnalytics.bannedPageCache = await readBannedPage();

    return IPAnalytics.bannedPageCache;
  }
}

export default IPAnalytics;

/**
 * Extracts the client's IP address from the request object.
 */
export function getClientIP(req: any): string {
  return (
    req.socket.remoteAddress ||
    req.ip ||
    (req.headers["x-forwarded-for"] as string) ||
    "0.0.0.0"
  );
}

/**
 * Checks if a user is banned either by their User-Agent or IP address.
 */
async function isBanned(userAgent: string, ip: string): Promise<boolean> {
  const checkBanService = new CheckBanService();

  const [bannedByUA, bannedByIP]: boolean[] = await Promise.all([
    checkBanService.isBannedByUA(userAgent),
    checkBanService.isBannedByIP(ip),
  ]);

  return bannedByUA || bannedByIP;
}

/**
 * Reads and returns the contents of the banned page HTML file.
 */
async function readBannedPage(): Promise<string> {
  const filePath: string = join(__dirname, config.BANNED_PAGE_LOCATION);

  try {
    const bannedPage: string = await fs.readFile(filePath, "utf-8");
    return bannedPage;
  } catch (err) {
    throw new Error(
      "Critical error. Banned Page not found! Try reinstalling IPAnalytics library."
    );
  }
}
