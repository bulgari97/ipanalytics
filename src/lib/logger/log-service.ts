import BanService from "../ban/ban-service";
import Redis from "../utils/redis";

class LogService extends Redis {
  private static ttlLOG: number = 86400;
  private static isConfigured: boolean = false;
  private static instance: LogService;

  static getInstance(ttlLOG?: number): LogService {
    // Instance of redis logger
    if (!LogService.instance) {
      LogService.instance = new LogService(ttlLOG);
    }
    return LogService.instance;
  }

  /*
    UNCOMMENT THIS CODE IF YOU WANT TO SEE YOUR TTLLOG ON THE CLIENT
    static getTtlLog(): number {
      return LogService.ttlLOG;
    }
  */

  private constructor(ttlLOG?: number) {
    super();
    if (LogService.isConfigured) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "LogService",
        message: "ttlLOG has already been configured and cannot be changed."
      })
    }
    LogService.ttlLOG = ttlLOG ?? LogService.ttlLOG;
    LogService.isConfigured = true;
  }

  async logVisit(ip: string, userAgent: string, url: string): Promise<void> {
    try {
      const lastVisit = Date.now();
      const multi = this.client.multi();

      // create ip
      multi.hSet(`ip:${ip}`, { userAgent, lastVisit });
      multi.expire(`ip:${ip}`, LogService.ttlLOG);

      multi.sAdd(`urls:${ip}`, url);
      multi.expire(`urls:${ip}`, LogService.ttlLOG);

      // this need for sort in LogData
      multi.zAdd("ips_by_time", { score: lastVisit, value: ip }); // sort by visits
      multi.zIncrBy("active_ips", 1, ip); // sort by activity

      // if this is new client userAgent or new ip - create
      multi.sAdd("UserAgents", userAgent);
      multi.expire("UserAgents", LogService.ttlLOG);

      multi.sAdd(`UserAgent:${userAgent}`, ip);
      multi.expire(`UserAgent:${userAgent}`, LogService.ttlLOG);

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
      if (error instanceof Error) {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "LogService.logVisit",
          error: error
        })
      } else {
        this.pino.log({
          level: LogLevel.ERROR,
          method: "LogService.logVisit",
          message: "Error with logging visit"
        });
      }
    }
  }
}

export default LogService;
