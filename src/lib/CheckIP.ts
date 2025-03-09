import Redis from "../utils/redis";
import RedisLogger from "./RedisLogger";
import express, { Request, Response } from "express";
import { promises as fs } from "fs";
import { join } from "path";
import Server from "./Server";

class CheckIP extends Redis {
  redisLogger;
  server;
  ttlLOG;
  ttlBAN;
  private userBannedPage;
 
  constructor(config?: { user?: string; password?: string; port?: number; host?: string }, settings?: { bannedPage?: string, ttlLOG?: number, ttlBAN?: number, port?: number }) {
    super(config);
    this.ttlLOG = settings?.ttlLOG;
    this.ttlBAN = settings?.ttlBAN;
    this.userBannedPage = settings?.bannedPage;
    
    RedisLogger.config(settings?.ttlLOG, settings?.ttlBAN)
    this.redisLogger = RedisLogger.getInstance();

    this.server = new Server(settings?.port)
  }

  // !!!!!!!!  ПЕРЕПИШИ ИСПОЛЬЗУЕМ FASTIFY ВМЕСТО EXPRESS  !!!!!!!!!!!!!!!!!!
  async logVisit (req: Request, res: Response) {
    try {
      const userAgent = req.headers["user-agent"] || "Unknown";
      const ip =
        req.ip ||
        (req.headers["x-forwarded-for"] as string) ||
        req.connection.remoteAddress ||
        "0.0.0.0";
  
      const url = req.url

      if (!ip?.trim()) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "logVisit",
          message: "IP is missing"
        });
        return;
      }

      if (!userAgent) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "logVisit",
          message: "UserAgent is missing"
        });
        return;
      }

      const [bannedByUA, bannedByIP] = await Promise.all([
        this.redisLogger.isBannedByUA(userAgent),
        this.redisLogger.isBannedByIP(ip)
      ]);

      if (bannedByUA || bannedByIP) {
        this.pino.log({
          level: LogLevel.WARN,
          method: "logVisit",
          message: `Blocked visit from ${ip} / ${userAgent}`
        });

        let bannedPage = this.userBannedPage;
        if (!bannedPage) {
          bannedPage = await this.getBannedPage();
        }

        return res.status(403).send(bannedPage);
      }

      return this.redisLogger.logVisit(ip, userAgent, url)
    } catch (error) {
      this.pino.log({
        level: LogLevel.ERROR,
        method: "LogVisit",
        error: error
      });
      return;
    }
  }

  private async getBannedPage() {
    return await fs.readFile(join(__dirname, "../web/pages/banned-page.html"), "utf-8");
  }
}

export default CheckIP;