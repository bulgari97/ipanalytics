import RedisLogger from "../logger/log-service";
import Redis from "../utils/redis";

class BanService extends Redis {
    private static ttlBAN: number = 86400 * 7;
    private static isConfigured: boolean = false;
    private static instance: BanService;

    static getInstance(ttlBAN?: number): BanService {
        if (!BanService.instance) {
            BanService.instance = new BanService(ttlBAN);
        }
        return BanService.instance;
    }

    /*
        UNCOMMENT THIS CODE IF YOU WANT TO SEE YOUR TTLBAN ON THE CLIENT
        static getTtlBan(): number {
            return BanService.ttlBAN;
        }
    */

    private constructor(ttlBAN?: number) {
        super();
        if (BanService.isConfigured) {
            this.pino.log({
                level: LogLevel.ERROR,
                method: "BanService",
                message: "ttlBAN has already been configured and cannot be changed."
            })
        }
        BanService.ttlBAN = ttlBAN ?? BanService.ttlBAN;
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
            const expireAt = Date.now() + BanService.ttlBAN * 1000;
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
            if (error instanceof Error) {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.banIP",
                  error: error
                })
              } else {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.banIP",
                  message: "Error with ban IP"
                });
              }
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
            const expireAt = Date.now() + BanService.ttlBAN * 1000;
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
            if (error instanceof Error) {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.banUA",
                  error: error
                })
              } else {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.banUA",
                  message: "Error with ban UA"
                });
              }
        }
    }

    // unban logic
    async unbanIP(ip: string): Promise<void> {
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

            await this.client.zRem("banned_ips", ip);
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.unbanIP",
                  error: error
                })
              } else {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.unbanIP",
                  message: "Error with unban IP"
                });
              }
        }
    }

    async unbanUA(ua: string): Promise<void> {
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

            // get all ips, that they can visit site
            const ipList = await this.client.sMembers(`UserAgent:${ua}`);
            if (ipList.length > 0) {
                await Promise.all(ipList.map((ip) => this.unbanIP(ip)));
            }

            // get this from banned uas
            await this.client.zRem("banned_uas", ua);
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.unbanUA",
                  error: error
                })
              } else {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.unbanUA",
                  message: "Error with unban UA"
                });
              }
        }
    }

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

            await this.client.zRemRangeByScore("banned_ips", 0, now);

            const score = await this.client.zScore("banned_ips", ip);

            return score !== null && score > now;
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.isBannedByIP",
                  error: error
                })
              } else {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.isBannedByIP",
                  message: "Error with check banned by IP"
                });
              }
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

            await this.client.zRemRangeByScore("banned_uas", 0, now);

            const score = await this.client.zScore("banned_uas", ua);

            return score !== null && score > now;
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.isBannedByUA",
                  error: error
                })
              } else {
                this.pino.log({
                  level: LogLevel.ERROR,
                  method: "BanService.isBannedByUA",
                  message: "Error with check banned by UA"
                });
              }
            return false;
        }
    }
}

export default BanService;
