import { Schema, model } from "mongoose";

const RoomSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const RoomModel = model("Room", RoomSchema);
