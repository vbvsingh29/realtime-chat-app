import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
  },
  base: {
    pid: false,
  },
});

export default logger;
