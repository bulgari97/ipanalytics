import Redis from "../utils/redis";

class LogData extends Redis {
  
  constructor () {
    super();
  };

  async getIPs(key: keyIPs, start: number, stop: number): Promise<IReturnedIPs[]> {
    try {
      const valuesByKey: IValuesByKey[] = await this.client.zRangeWithScores(key, start, stop, { REV: true });

      if (!valuesByKey.length) return [];

      return Promise.all(
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

  async getUAs(key: keyUAs, start: number, stop: number): Promise<IReturnedUAs[]> {
    try {
      const valuesByKey: IValuesByKey[] = await this.client.zRangeWithScores(key, start, stop, { REV: true });

      if (!valuesByKey.length) return [];

      return Promise.all(
        valuesByKey.map(async ({ value: ua, score }) => {
          const ips: string[] = await this.client.sMembers(`UserAgent:${ua}`)
              
          return { ua, ips, score };
        })
      );
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "getUAs",
        error: error
      });
      return [];
    }
  };
  
  async getBanned (key: keyBANNED, start: number, stop: number): Promise<IValuesByKey[]> {
    try {
      const bannedIPs = await this.client.zRangeWithScores(key, start, stop, { REV: true });

      if (!bannedIPs.length) return [];
      
      return bannedIPs.map(({ value, score }) => ({ value, score }));
    } catch (error) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "getBanned",
        error: error
      });
      return [];
    }
  };
};

export default LogData;
