import Redis from "../utils/redis";
import config from "../config/config.json";

/**
 * BanService is responsible for banning IP addresses and User-Agents
 * for a specified time-to-live (TTL)
 */
class BanService extends Redis {
  private static TTL_BAN: number = config.TTL_BAN;
  private static isConfigured: boolean = false;
  private static instance: BanService;

  /**
   * Returns a singleton instance of BanService.
   * TTL for bans can only be configured once on first initialization.
   *
   * @param {number} [ttlBAN] - Optional TTL for bans in seconds.
   * @returns {BanService} Singleton instance of BanService.
   *
   * @example
   * const banService = BanService.getInstance(3600); // 1 hour TTL
   */
  static getInstance(ttlBAN?: number): BanService {
    if (!BanService.instance) {
      BanService.instance = new BanService(ttlBAN);
    }
    return BanService.instance;
  }

  private constructor(ttlBAN?: number) {
    super();
    if (BanService.isConfigured) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "BanService",
        message: "ttlBAN has already been configured and cannot be changed",
      });
    }
    BanService.TTL_BAN = ttlBAN ?? BanService.TTL_BAN;
    BanService.isConfigured = true;
  }

  async banIP(ip: string): Promise<void> {
    try {
      // this method is available only in client. so here there aren`t check for ban
      if (!ip?.trim()) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "BanService",
          message: "IP is missing",
        });
        return;
      }

      const multi = this.client.multi();

      // delete data
      multi.del(`ip:${ip}`);
      multi.del(`urls:${ip}`);

      // delete from sort
      multi.zRem("ips_by_time", ip);
      multi.zRem("active_ips", ip);

      // add to banned list
      const expireAt = Date.now() + BanService.TTL_BAN * 1000;
      multi.zAdd("banned_ips", { score: expireAt, value: ip });

      const result = await multi.exec();

      if (!result) {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "BanService",
          message: "Failed to execute Redis transaction",
        });
      }
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "BanService.banIP",
        message: "Error with ban IP",
        error,
      });
    }
  }

  async banUA(ua: string): Promise<void> {
    try {
      // this method is available only in client. so here there aren`t check for ban
      if (!ua) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "BanService",
          message: "UA is missing",
        });
        return;
      }

      // get all ips and ban them
      const ipList = await this.client.sMembers(`UserAgent:${ua}`);

      if (ipList.length > 0) {
        await Promise.all(ipList.map((ip: string) => this.banIP(ip)));
      }

      // throw ua into banned uas
      const multi = this.client.multi();

      // delete from sort
      multi.zRem("uas_by_time", ua);
      multi.zRem("active_uas", ua);

      // add to banned list
      const expireAt = Date.now() + BanService.TTL_BAN * 1000;
      multi.zAdd("banned_uas", { score: expireAt, value: ua });

      const result = await multi.exec();

      if (!result) {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "BanService",
          message: "Failed to execute Redis transaction",
        });
      }
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "BanService.banUA",
        message: "Error with ban UA",
        error,
      });
    }
  }
}

export default BanService;
