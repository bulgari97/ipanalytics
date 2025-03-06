import Redis from "ioredis";
import { strict as assert } from "assert";

describe("Log Visit", function () {
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

  it("should execute multi transaction correctly", async function () {
    const ip: string = "127.0.0.1";
    const userAgent: string = "Mozilla/5.0";
    const url: string = "/";
    const lastVisit: number = Date.now();
    const ttlLOG: number = 10;

    const multi = redis.multi();

    // create ip
    multi.hSet(`ip:${ip}`, { userAgent, lastVisit });
    multi.expire(`ip:${ip}`, this.ttlLOG);

    multi.sAdd(`urls:${ip}`, url);
    multi.expire(`urls:${ip}`, this.ttlLOG);

    // this need for sort in LogData
    multi.zAdd("ips_by_time", { score: lastVisit, value: ip }); // sort by visits
    multi.zRemRangeByScore("ips_by_time", 0, Date.now() - this.ttlLOG * 1000);

    multi.zIncrBy("active_ips", 1, ip); // sort by activity
    multi.zRemRangeByScore("active_ips", 0, Date.now() - this.ttlLOG * 1000);

    // if this is new client userAgent or new ip - create
    multi.sAdd("UserAgents", userAgent);
    multi.expire("UserAgents", this.ttlLOG);
    
    multi.sAdd(`UserAgent:${userAgent}`, ip);
    multi.expire(`UserAgent:${userAgent}`, this.ttlLOG);

    // this need for sort in LogData
    multi.zAdd("uas_by_time", { score: lastVisit, value: userAgent }); // sort by visits
    multi.zRemRangeByScore("uas_by_time", 0, Date.now() - this.ttlLOG * 1000);

    multi.zIncrBy("active_uas", 1, userAgent); // sort by activity
    multi.zRemRangeByScore("active_uas", 0, Date.now() - this.ttlLOG * 1000);

    await multi.exec(); 


    // check that data are in
    const cacheUserAgent = await redis.hGet(`ip:${ip}`, "userAgent");
    assert.strictEqual(cacheUserAgent, userAgent);

    const cacheUrls = await redis.sMembers(`urls:${ip}`);
    assert.deepStrictEqual(cacheUrls, [url]);

    const cacheActiveIps = await redis.zScore("active_ips", ip);
    assert.strictEqual(cacheActiveIps, "1");

    const cacheUserAgents = await redis.sMembers("UserAgents");
    assert.deepStrictEqual(cacheUserAgents, [userAgent]);

    const cacheIpFromUa = await redis.sMembers(`UserAgent:${userAgent}`);
    assert.deepStrictEqual(cacheIpFromUa, [ip]);

    console.log("Test passed");
  });

//   it("should expire keys", async function () {
//     const ip: string = "192.168.0.2";
//     const userAgent: string = "Mozilla/5.0";
//     const ttlLOG: number = 2; // Уменьшаем TTL для теста

//     const multi = redis.multi();
//     multi.sAdd("UserAgents", userAgent);
//     multi.expire("UserAgents", ttlLOG);
//     await multi.exec();

//     await new Promise((r) => setTimeout(r, 2500)); // Ждем, пока ключ пропадет

//     const userAgents = await redis.sMembers("UserAgents");
//     assert.strictEqual(userAgents.length, 0); // Ключ должен исчезнуть

//     console.log("✅ Redis TTL Test Passed!");
//   });
});
