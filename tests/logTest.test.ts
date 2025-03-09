import Redis from "ioredis";
import { strict as assert } from "assert";

const TTL_LOG = 86400;

describe("Redis Logging", function () {
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

  it("log visit", async function () {
      const ip = "127.0.0.1";
      const userAgent = "Mozilla/5.0";
      const url = "/";
      const lastVisit = Date.now();
  
      const multi = redis.multi()

        // work with ips
        .hset(`ip:${ip}`, { userAgent, lastVisit })
        .expire(`ip:${ip}`, TTL_LOG)

        .sadd(`urls:${ip}`, url)
        .expire(`urls:${ip}`, TTL_LOG)
  
        // this need for sort
        .zadd("ips_by_time", lastVisit, ip) // sort by time
        .zincrby("active_ips", 1, ip) // sort by activity
  

        // work with uas
        .sadd("UserAgents", userAgent)
        .expire("UserAgents", TTL_LOG)

        .sadd(`UserAgent:${userAgent}`, ip)
        .expire(`UserAgent:${userAgent}`, TTL_LOG)
  
        // this need for sort
        .zadd("uas_by_time", lastVisit, userAgent) // sort by time
        .zincrby("active_uas", 1, userAgent); // sort by acrivity
  
      await multi.exec();
  
      // Check that data are in
      assert.strictEqual(await redis.hget(`ip:${ip}`, "userAgent"), userAgent);
      assert.strictEqual(Number(await redis.hget(`ip:${ip}`, "lastVisit")), lastVisit);
  
      assert.deepStrictEqual(await redis.smembers(`urls:${ip}`), [url]);
  
      assert.strictEqual(await redis.zscore("ips_by_time", ip), String(lastVisit));
      assert.strictEqual(await redis.zscore("active_ips", ip), "1");
  
      
      assert.deepStrictEqual(await redis.smembers("UserAgents"), [userAgent]);
      assert.deepStrictEqual(await redis.smembers(`UserAgent:${userAgent}`), [ip]);
  
      assert.strictEqual(await redis.zscore("uas_by_time", userAgent), String(lastVisit));
      assert.strictEqual(await redis.zscore("active_uas", userAgent), "1");
    });

  it("should expire keys", async function () {
    const userAgent = "Mozilla/5.0";
    const shortTTL = 2; 
    const lastVisit = Date.now();
    const ip = "127.0.0.1";
    const url = "/";

    await redis.multi()
      // work with ips
      .hset(`ip:${ip}`, { userAgent, lastVisit })
      .expire(`ip:${ip}`, shortTTL)

      .sadd(`urls:${ip}`, url)
      .expire(`urls:${ip}`, shortTTL)


      // work with uas
      .sadd("UserAgents", userAgent)
      .expire("UserAgents", shortTTL)

      .sadd(`UserAgent:${userAgent}`, ip)
      .expire(`UserAgent:${userAgent}`, shortTTL)

      .exec();
    await new Promise((resolve) => setTimeout(resolve, 3000));

    assert.strictEqual((await redis.smembers("UserAgents")).length, 0);
    assert.strictEqual(await redis.exists(`ip:${ip}`), 0);
    assert.strictEqual(await redis.exists(`urls:${ip}`), 0);
    assert.strictEqual(await redis.exists(`UserAgent:${userAgent}`), 0);
  });
});