import express, { Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import config from "./config";
import logger from "./utils/logger";
import { version } from "../package.json";
import socket from "./socket";
import connectToDatabase from "./db";
import authRouter from "./routes/auth";

const port = config.get<Number>("port");
const host = config.get<string>("host");
const corsOrigin = config.get<string>("corsOrigin");

const app = express();

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

app.use("/api/auth", authRouter);

import mongoose from "mongoose";

app.get("/healthcheck", (_, res: Response) => {
  const dbConnected = mongoose.connection.readyState === 1;
  if (dbConnected) {
    res.json({ status: "healthy", database: "connected", version });
  } else {
    res.status(503).json({ status: "unhealthy", database: "disconnected", version });
  }
});

async function startServer() {
  try {
    await connectToDatabase();
    httpServer.listen(port, () => {
      logger.info(`server is listening with version ${version}`);
      logger.info(`http://localhost:${port}`);
      socket({ io });
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
