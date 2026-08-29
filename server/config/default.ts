import "dotenv/config";

export default {
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  port: process.env.PORT || 4000,
  host: process.env.HOST || "localhost",
  dbUri: process.env.DB_URI || "mongodb://localhost:27017/chat-app",
  jwtSecret: process.env.JWT_SECRET || "chat-app-secret-key-12345",
};
