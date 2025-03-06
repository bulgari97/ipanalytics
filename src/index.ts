import express, { Request, Response } from "express";
import CheckIP from "./lib/CheckIP";



// Testing 
const app = express();
const PORT = 3000;

const newChecker = new CheckIP({
  user: "default",
  password: "31314",
  host: "localhost",
  port: 1923
})

app.use("/", (req: Request, res: Response) => {
  newChecker.logVisit(req)
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});