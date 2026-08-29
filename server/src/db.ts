import mongoose from "mongoose";
import config from "config";
import logger from "./utils/logger";

async function connectToDatabase() {
  const dbUri = config.get<string>("dbUri");
  try {
    await mongoose.connect(dbUri);
    logger.info("Connected to MongoDB database");
  } catch (e: any) {
    logger.error("Error connecting to MongoDB database", e);
    process.exit(1);
  }
}

export default connectToDatabase;
