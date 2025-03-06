import Redis from "../utils/redis";
import RedisLogger from "./RedisLogger";
import express, { Request, Response } from "express";

class CheckIP extends Redis {
  redisLogger;
  ttlLOG;
  ttlBAN;
 
  constructor(config?: { user?: string; password?: string; port?: number; host?: string }, ttlLOG?: number, ttlBAN?: number) {
    super(config);
    this.ttlLOG = ttlLOG;
    this.ttlBAN = ttlBAN;
    
    // ОПТИМИЗИРОВАТЬ
    this.redisLogger = new RedisLogger(ttlLOG, ttlBAN);
  }

  async logVisit (req: Request): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"] || "Unknown";
      const ip =
        req.ip ||
        (req.headers["x-forwarded-for"] as string) ||
        req.connection.remoteAddress ||
        "0.0.0.0";
  
      const url = req.url
  
      return this.redisLogger.logVisit(ip, userAgent, url)
    } catch (error) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "LogVisit",
        error: error
      });
    }
  }
}

export default CheckIP;