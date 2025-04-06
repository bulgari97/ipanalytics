import Redis from "../utils/redis";

/**
 * CheckBanService is responsible for checking whether an IP address
 * or User-Agent is currently banned based on Redis sorted sets.
 */
class CheckBanService extends Redis {
  // check by ban
  async isBannedByIP(ip: string): Promise<boolean> {
    try {
      if (!ip?.trim()) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "BanService",
          message: "IP is missing",
        });
        return false;
      }

      const now = Date.now();

      // set now date for check for unbanned
      await this.client.zRemRangeByScore("banned_ips", 0, now);

      // check maybe this ip is unbanned now
      const score = await this.client.zScore("banned_ips", ip);

      return score !== null && score > now;
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "BanService.isBannedByIP",
        message: "Error with check banned by IP",
        error,
      });

      return false;
    }
  }

  async isBannedByUA(ua: string): Promise<boolean> {
    try {
      if (!ua) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "BanService",
          message: "UA is missing",
        });
        return false;
      }

      const now = Date.now();

      // set now date for check for unbanned
      await this.client.zRemRangeByScore("banned_uas", 0, now);

      // check maybe this ua is unbanned now
      const score = await this.client.zScore("banned_uas", ua);

      /*
        ua unbanned and ip is banned cannot be. both ban for several
        time. if ua unbanned => ip unbanned also
      */

      return score !== null && score > now;
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "BanService.isBannedByUA",
        message: "Error with check banned by UA",
        error,
      });

      return false;
    }
  }
}

export default CheckBanService;
