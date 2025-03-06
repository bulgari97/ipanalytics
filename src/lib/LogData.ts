import Redis from "../utils/redis";

class LogData extends Redis {
  
  constructor () {
    super();
  };

  async getIPs(key: keyIPs, start: number, stop: number): Promise<IReturnedArray[]> {
    try {
      const valuesByKey: IValuesByKey[] = await this.client.zRangeWithScores(key, start, stop, { REV: true });

      if (valuesByKey.length === 0) {
          return [];
      };

      return await Promise.all(
        valuesByKey.map(async ({ value: ip }) => {
          const multi = this.client.multi();
              
          multi.hGet(`ip:${ip}`, "userAgent");
          multi.hGet(`ip:${ip}`, "lastVisit");
          multi.sMembers(`urls:${ip}`);
          
          const [userAgentRaw, lastVisitRaw, urlsRaw] = await multi.exec() as [string | null, string | null, string[] | null];
        
          return { 
            ip, 
            userAgent: userAgentRaw ?? undefined, 
            urls: urlsRaw ?? [], 
            lastVisit: lastVisitRaw ? Number(lastVisitRaw) : 0 
          };
        })
      );
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "getIPs",
        error: error
      });
      return [];
    }
  };

  async getUAs(key: keyUAs, start: number, stop: number) {
    try {
      const valuesByKey: IValuesByKey[] = await this.client.zRangeWithScores(key, start, stop, { REV: true });

      if (valuesByKey.length === 0) {
          return [];
      };

      return await Promise.all(
        valuesByKey.map(async ({ value: UA, score }) => {
          const ips: string[] = await this.client.sMembers(`UserAgent:${UA}`)
              
          return { UA, ips, score };
        })
      );
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "getIPs",
        error: error
      });
      return [];
    }
  };


  // getBannedIPs


  // getBannedUAs
}

export default LogData;
