import Redis from "ioredis";
import { strict as assert } from "assert";

describe("Redis Unban", function () {
    let redis: Redis;
  
    before(async function () {
      redis = new Redis();
    });
  
    after(async function () {
      await redis.quit();
    });
  
    beforeEach(async function () {
      await redis.flushall();
    });
  
    it("unban ip", async function () {
        const ip = "127.0.0.1";
        await redis.zrem("banned_ips", ip);
        assert.strictEqual(await redis.zscore("banned_ips", ip), null);
      });
    
    it("unban ua", async function () {
        const userAgent = "Mozilla/5.0";
        await redis.zrem("banned_uas", userAgent);
        assert.strictEqual(await redis.zscore("banned_uas", userAgent), null);
    });
  });