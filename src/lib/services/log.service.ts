import Redis from "../utils/redis";
import config from "../config/config.json";

/**
 * LogService is a singleton class responsible for logging visits using Redis.
 */
class LogService extends Redis {
  private static TTL_LOG: number = config.TTL_LOG;
  private static isConfigured: boolean = false;
  private static instance: LogService;

  /**
   * Returns a singleton instance of LogService.
   * TTL can be optionally configured during the first call.
   *
   * @param {number} [ttlLOG] - Optional custom TTL for log entries (only applied once).
   * @returns {LogService} The singleton instance of LogService.
   *
   * @example
   * const logger = LogService.getInstance(3600);
   */
  static getInstance(ttlLOG?: number): LogService {
    // Instance of redis logger
    if (!LogService.instance) {
      LogService.instance = new LogService(ttlLOG);
    }
    return LogService.instance;
  }

  private constructor(ttlLOG?: number) {
    super();
    if (LogService.isConfigured) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "LogService",
        message: "ttlLOG has already been configured and cannot be changed.",
      });
    }
    LogService.TTL_LOG = ttlLOG ?? LogService.TTL_LOG;
    LogService.isConfigured = true;
  }

  async logVisit(ip: string, userAgent: string, url: string): Promise<void> {
    try {
      const lastVisit = Date.now();
      const multi = this.client.multi();

      // create ip
      multi.hSet(`ip:${ip}`, { userAgent, lastVisit });
      multi.expire(`ip:${ip}`, LogService.TTL_LOG);

      multi.sAdd(`urls:${ip}`, url);
      multi.expire(`urls:${ip}`, LogService.TTL_LOG);

      // this need for sort in LogData
      multi.zAdd("ips_by_time", { score: lastVisit, value: ip }); // sort by visits
      multi.zIncrBy("active_ips", 1, ip); // sort by activity

      // if this is new client userAgent or new ip - create
      multi.sAdd("UserAgents", userAgent);
      multi.expire("UserAgents", LogService.TTL_LOG);

      multi.sAdd(`UserAgent:${userAgent}`, ip);
      multi.expire(`UserAgent:${userAgent}`, LogService.TTL_LOG);

      // this need for sort in LogData
      multi.zAdd("uas_by_time", { score: lastVisit, value: userAgent }); // sort by visits
      multi.zIncrBy("active_uas", 1, userAgent); // sort by activity

      const result = await multi.exec();

      if (!result) {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "LogService",
          message: "Failed to execute Redis transaction",
        });
      }
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "LogService.logVisit",
        message: "Error with logging visit",
        error,
      });
    }
  }
}

export default LogService;
