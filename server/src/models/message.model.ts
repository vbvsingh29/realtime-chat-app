import { Schema, model } from "mongoose";

const MessageSchema = new Schema(
  {
    roomId: { type: String, required: true },
    username: { type: String, required: true },
    message: { type: String, required: true },
    time: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 172800 } // TTL index: 48 hours (172,800 seconds)
  }
);

export const MessageModel = model("Message", MessageSchema);
