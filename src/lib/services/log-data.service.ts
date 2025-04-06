import Redis from "../utils/redis";

interface IValuesByKey {
  value: string;
  score: number;
}

/**
 * LogData is a class that extends the Redis wrapper to provide read-only
 * analytics functionality.
 */
class LogData extends Redis {
  constructor() {
    super();
  }

  async getIPs(
    key: keyIPs,
    start: number,
    stop: number
  ): Promise<IReturnedIPs[]> {
    try {
      // see how save and sort keys in log.serivice.ts. sorting by time
      // or amount of visits
      const valuesByKey: IValuesByKey[] = await this.client.zRangeWithScores(
        key,
        start,
        stop,
        { REV: true }
      );

      if (!valuesByKey.length) return [];

      // next step get ua, url. because valuesByKey have only value: ip and
      // score - time or count of visits
      return Promise.all(
        valuesByKey.map(async ({ value: ip }) => {
          const multi = this.client.multi();

          multi.hGet(`ip:${ip}`, "userAgent");
          multi.hGet(`ip:${ip}`, "lastVisit");
          multi.sMembers(`urls:${ip}`);

          const [userAgentRaw, lastVisitRaw, urlsRaw] =
            (await multi.exec()) as [
              string | null,
              string | null,
              string[] | null
            ];

          return {
            ip,
            userAgent: userAgentRaw ?? undefined,
            urls: urlsRaw ?? [],
            lastVisit: lastVisitRaw ? Number(lastVisitRaw) : 0,
          };
        })
      );
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "LogData.getIPS",
        message: "Error with getIPs",
        error,
      });
      return [];
    }
  }

  async getUAs(
    key: keyUAs,
    start: number,
    stop: number
  ): Promise<IReturnedUAs[]> {
    try {
      // see how save and sort keys in log.serivice.ts. sorting by time
      // or amount of visits
      const valuesByKey: IValuesByKey[] = await this.client.zRangeWithScores(
        key,
        start,
        stop,
        { REV: true }
      );

      if (!valuesByKey.length) return [];

      // next step get ips. because valuesByKey have only value: ua and
      // score - time or count of visits
      return Promise.all(
        valuesByKey.map(async ({ value: ua, score }) => {
          const ips: string[] = await this.client.sMembers(`UserAgent:${ua}`);

          return { ua, ips, score };
        })
      );
    } catch (error: unknown) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "LogData.getUAs",
        message: "Error with getUAs",
        error,
      });
      return [];
    }
  }

  async getBanned(
    key: keyBANNED,
    start: number,
    stop: number
  ): Promise<IValuesByKey[]> {
    try {
      // see how save and sort keys in ban.service.ts
      const bannedIPs = await this.client.zRangeWithScores(key, start, stop, {
        REV: true,
      });

      if (!bannedIPs.length) return [];

      return bannedIPs.map(({ value, score }) => ({ value, score }));
    } catch (error) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "LogData.getBanned",
        message: "Error with getBanned",
        error,
      });
      return [];
    }
  }
}

export default LogData;
