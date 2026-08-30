import "dotenv/config";

const configValues = {
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST || "localhost",
  dbUri: process.env.DB_URI || "mongodb://localhost:27017/chat-app",
  jwtSecret: process.env.JWT_SECRET || "chat-app-secret-key-12345",
};

const config = {
  get<T>(key: keyof typeof configValues): T {
    return configValues[key] as unknown as T;
  }
};

export default config;
