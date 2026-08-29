import { Server, Socket } from "socket.io";
import logger from "./utils/logger";
import { nanoid } from "nanoid";
import { RoomModel } from "./models/room.model";
import { MessageModel } from "./models/message.model";

const EVENTS = {
  connection: "connection",
  CLIENT: {
    CREATE_ROOM: "CREATE_ROOM",
    SEND_ROOM_MESSAGE: "SEND_ROOM_MESSAGE",
    JOIN_ROOM: "JOIN_ROOM",
  },
  SERVER: {
    ROOMS: "ROOMS",
    JOINED_ROOM: "JOINED_ROOM",
    ROOM_MESSAGE: "ROOM_MESSAGE",
  },
};

async function getRoomsRecord() {
  const roomsRecord: Record<string, { name: string }> = {};
  try {
    const dbRooms = await RoomModel.find({}).lean();
    dbRooms.forEach((r) => {
      roomsRecord[r.roomId] = { name: r.name };
    });
  } catch (error) {
    logger.error("Error fetching rooms", error);
  }
  return roomsRecord;
}

function socket({ io }: { io: Server }) {
  logger.info(`Socket Enabled`);

  io.on(EVENTS.connection, async (socket: Socket) => {
    logger.info(`User Connected ${socket.id}`);

    // Emit existing rooms on connection
    const rooms = await getRoomsRecord();
    socket.emit(EVENTS.SERVER.ROOMS, rooms);

    /*
    when a user creates new room
    */
    socket.on(EVENTS.CLIENT.CREATE_ROOM, async ({ roomName, creatorId }) => {
      if (!roomName || String(roomName).trim().length === 0 || String(roomName).length > 30) {
        return;
      }
      try {
        const roomId = nanoid();

        // Save Room to DB
        const newRoom = new RoomModel({
          roomId,
          name: roomName,
          creator: creatorId || "000000000000000000000000", // Fallback ID
        });
        await newRoom.save();

        const updatedRooms = await getRoomsRecord();

        // Broadcast to all sockets
        io.emit(EVENTS.SERVER.ROOMS, updatedRooms);

        // Notify room creator they joined
        socket.join(roomId);
        socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
      } catch (error) {
        logger.error("Error creating room", error);
      }
    });

    /*
    when a user sends a message
    */
    socket.on(
      EVENTS.CLIENT.SEND_ROOM_MESSAGE,
      async ({ roomId, message, username }) => {
        if (!message || String(message).trim().length === 0 || String(message).length > 500) {
          return;
        }
        try {
          const date = new Date();
          const time = `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;

          // Save message to database
          const newMessage = new MessageModel({
            roomId,
            username,
            message,
            time,
          });
          await newMessage.save();

          socket.to(roomId).emit(EVENTS.SERVER.ROOM_MESSAGE, {
            message,
            username,
            time,
          });
        } catch (error) {
          logger.error("Error sending message", error);
        }
      }
    );

    /*
    When a user joins a room
    */
    socket.on(EVENTS.CLIENT.JOIN_ROOM, async (roomId) => {
      try {
        socket.join(roomId);
        socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);

        // Fetch chat history from DB (TTL index cleans up messages > 48h)
        const history = await MessageModel.find({ roomId })
          .sort({ createdAt: 1 })
          .limit(50)
          .lean();

        socket.emit("ROOM_HISTORY", history);
      } catch (error) {
        logger.error("Error joining room", error);
      }
    });

    /*
    Typing Indicator
    */
    socket.on("TYPING", ({ roomId, username, isTyping }) => {
      socket.to(roomId).emit("TYPING", { username, isTyping });
    });
  });
}

export default socket;
