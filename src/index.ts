import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import IPLogger from "./lib/logger/ip-logger";

// Example 


const app = Fastify();
const PORT = 3000;

const newChecker = new IPLogger({
  host: "localhost",
  port: 6379
}, {
  bannedPage: "<h1>Access Denied</h1>",
  ttlLOG: 86400, // Store time logs (in seconds)
  ttlBAN: 604800 // Store ban (in seconds)
});

app.get("/", async (req: FastifyRequest, res: FastifyReply) => {
  return newChecker.logVisit(req, res);
});

app.listen({ port: PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});