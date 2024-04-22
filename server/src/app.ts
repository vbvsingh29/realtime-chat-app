import express, { Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import config from "config";
import logger from "./utils/logger";
import { version } from "../package.json";
import socket from "./socket";

const port = config.get<Number>("port");
const host = config.get<string>("host");
const corsOrigin = config.get<string>("corsOrigin");

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

app.get("/healthcheck", (_, res: Response) => {
  res.send(`I am Up and running version ${version}`);
});

httpServer.listen(port, () => {
  logger.info(`server is listening with version ${version}`);
  logger.info(`http://localhost:${port}`);
  socket({io})
});
