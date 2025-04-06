import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import express, { Request, Response } from "express";
import IPAnalytics from "./lib";

// Example 


const app = express();
const PORT = 3000;

// Инициализация IPLogger
const ipLogger = new IPAnalytics(
  {
    host: "localhost",
    port: 6379,
    password: "yourpass",
  },
  {
    bannedPage: "<h1>Access Denied</h1>",
    ttlLOG: 86400,
    ttlBAN: 604800,
    port: 3000,
    logBannedRequests: false,
    useTrustProxy: false
  }
);

// Использование на руте
app.get("/", async (req: Request, res: Response) => {
  ipLogger.handle(req, res)
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});