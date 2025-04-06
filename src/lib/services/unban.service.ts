import Redis from "../utils/redis";

/**
 * Service for work with unban logic.
 * Has 2 methods
 *
 * ```ts
 *   unbanIP(ip: string): Promise<void>
 *   unbanUA(ua: string): Promise<void>
 * ```
 */
class UnbanService extends Redis {
  constructor() {
    super();
  }

  //unban logic
  async unbanIP(ip: string): Promise<void> {
    try {
      // this method is available only in client. so here there aren`t check for ban
      if (!ip?.trim()) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "UnbanService",
          message: "IP is missing",
        });
        return;
      }

      await this.client.zRem("banned_ips", ip);
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "UnbanService.unbanIP",
        message: "Error with unban IP",
        error,
      });
    }
  }

  async unbanUA(ua: string): Promise<void> {
    try {
      // this method is available only in client. so here there aren`t check for ban
      if (!ua) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "UnbanService",
          message: "UA is missing",
        });
        return;
      }

      // get all ips, that they can visit site
      const ipList = await this.client.sMembers(`UserAgent:${ua}`);
      if (ipList.length > 0) {
        await Promise.all(ipList.map((ip) => this.unbanIP(ip)));
      }

      // get this from banned uas
      await this.client.zRem("banned_uas", ua);
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "UnbanService.unbanUA",
        message: "Error with unban UA",
        error,
      });
    }
  }
}

export default UnbanService;
