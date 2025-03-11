import Redis from "ioredis";
import { strict as assert } from "assert";

describe("Redis Ban", function () {
    let redis: Redis;
    const TTL_BAN = 10;
  
    before(async function () {
      redis = new Redis();
    });
  
    after(async function () {
      await redis.quit();
    });
  
    beforeEach(async function () {
      await redis.flushall();
    });
  
    it("ban ip", async function () {
        const ip = "127.0.0.1";
        const expireAt = Date.now() + TTL_BAN * 1000;
    
        await redis.multi()
          .del(`ip:${ip}`)
          .del(`urls:${ip}`)
          .zrem("ips_by_time", ip)
          .zrem("active_ips", ip)
          .zadd("banned_ips", expireAt, ip)
          .exec();
    
        assert.notStrictEqual(await redis.zscore("banned_ips", ip), null);
    });
    
    it("ban ua", async function () {
        const userAgent = "Mozilla/5.0";
        const expireAt = Date.now() + TTL_BAN * 1000;
    
        await redis.multi()
          .zrem("uas_by_time", userAgent)
          .zrem("active_uas", userAgent)
          .zadd("banned_uas", expireAt, userAgent)
          .exec();
    
        assert.notStrictEqual(await redis.zscore("banned_uas", userAgent), null);
    });
  });