import { Server, Socket } from "socket.io";
import logger from "./utils/logger";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import config from "./config";
import { RoomModel } from "./models/room.model";
import { MessageModel } from "./models/message.model";
import { UserModel } from "./models/user.model";

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

const jwtSecret = config.get<string>("jwtSecret");

async function getRoomsForUser(userId: string) {
  const roomsRecord: Record<string, { name: string; isPrivate: boolean; creator: string; members: string[] }> = {};
  try {
    const dbRooms = await RoomModel.find({
      $or: [
        { isPrivate: { $ne: true } }, // public rooms
        { creator: userId },       // private rooms they created
        { members: userId }        // private rooms they joined/are members of
      ]
    }).lean();
    dbRooms.forEach((r) => {
      roomsRecord[r.roomId] = {
        name: r.name,
        isPrivate: !!r.isPrivate,
        creator: r.creator.toString(),
        members: (r.members || []).map((m) => m.toString())
      };
    });
  } catch (error) {
    logger.error("Error fetching rooms", error);
  }
  return roomsRecord;
}

async function broadcastRooms(io: Server) {
  try {
    const sockets = await io.fetchSockets();
    for (const s of sockets) {
      const userId = s.data.user?._id;
      if (userId) {
        const rooms = await getRoomsForUser(userId);
        s.emit(EVENTS.SERVER.ROOMS, rooms);
      }
    }
  } catch (error) {
    logger.error("Error broadcasting rooms", error);
  }
}

function socket({ io }: { io: Server }) {
  logger.info(`Socket Enabled`);

  // JWT handshake authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }
    try {
      const decoded = jwt.verify(token, jwtSecret) as { _id: string; username: string };
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on(EVENTS.connection, async (socket: Socket) => {
    const userId = socket.data.user?._id;
    const username = socket.data.user?.username;
    logger.info(`User Connected ${socket.id} (username: ${username})`);

    // Emit existing rooms on connection
    if (userId) {
      const rooms = await getRoomsForUser(userId);
      socket.emit(EVENTS.SERVER.ROOMS, rooms);
    }

    /*
    when a user creates new room
    */
    socket.on(EVENTS.CLIENT.CREATE_ROOM, async ({ roomName, isPrivate }) => {
      if (!roomName || String(roomName).trim().length === 0 || String(roomName).length > 30) {
        return;
      }
      const creatorId = socket.data.user?._id;
      if (!creatorId) return;

      try {
        const roomId = nanoid();

        // Save Room to DB
        const newRoom = new RoomModel({
          roomId,
          name: roomName,
          creator: creatorId,
          isPrivate: !!isPrivate,
          members: [creatorId] // Creator is the first member
        });
        await newRoom.save();

        // Broadcast updated rooms list to all sockets
        await broadcastRooms(io);

        // Notify room creator they joined
        socket.join(roomId);
        socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);

        // Send room details populated
        const populatedRoom = await RoomModel.findOne({ roomId })
          .populate("creator members", "username")
          .lean();
        if (populatedRoom) {
          socket.emit("ROOM_DETAILS", {
            roomId: populatedRoom.roomId,
            name: populatedRoom.name,
            creator: populatedRoom.creator,
            members: populatedRoom.members,
            isPrivate: populatedRoom.isPrivate
          });
        }
      } catch (error) {
        logger.error("Error creating room", error);
      }
    });

    /*
    when a user sends a message
    */
    socket.on(
      EVENTS.CLIENT.SEND_ROOM_MESSAGE,
      async ({ roomId, message, username: msgUser }) => {
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
            username: msgUser,
            message,
            time,
          });
          await newMessage.save();

          socket.to(roomId).emit(EVENTS.SERVER.ROOM_MESSAGE, {
            message,
            username: msgUser,
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
      const joiningUserId = socket.data.user?._id;
      if (!joiningUserId) return;

      try {
        const room = await RoomModel.findOne({ roomId });
        if (!room) {
          socket.emit("ERROR", "Room not found");
          return;
        }

        // If the room is private and the user is not a member and not the creator,
        // we add them to the members since they joined via the roomId.
        const membersStr = (room.members || []).map((m) => m.toString());
        if (room.isPrivate) {
          if (room.creator.toString() !== joiningUserId && !membersStr.includes(joiningUserId)) {
            room.members.push(joiningUserId);
            await room.save();
            // Broadcast updated rooms list to everyone
            await broadcastRooms(io);
          }
        }

        socket.join(roomId);
        socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);

        // Broadcast updated room details to everyone in the room
        const populatedRoom = await RoomModel.findOne({ roomId })
          .populate("creator members", "username")
          .lean();
        if (populatedRoom) {
          io.to(roomId).emit("ROOM_DETAILS", {
            roomId: populatedRoom.roomId,
            name: populatedRoom.name,
            creator: populatedRoom.creator,
            members: populatedRoom.members,
            isPrivate: populatedRoom.isPrivate
          });
        }

        // Fetch chat history from DB
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
    Add user to a private room by username
    */
    socket.on("ADD_USER", async ({ roomId, usernameToAdd }) => {
      const currentUserId = socket.data.user?._id;
      if (!currentUserId) return;

      try {
        const room = await RoomModel.findOne({ roomId });
        if (!room) {
          socket.emit("ERROR", "Room not found.");
          return;
        }

        if (room.creator.toString() !== currentUserId) {
          socket.emit("ERROR", "Only the room owner can add members.");
          return;
        }

        // Find user to add by username
        const userToAdd = await UserModel.findOne({ username: String(usernameToAdd).trim() });
        if (!userToAdd) {
          socket.emit("ERROR", `User "${usernameToAdd}" not found.`);
          return;
        }

        const toAddIdStr = userToAdd._id.toString();
        const membersStr = (room.members || []).map((m) => m.toString());

        if (membersStr.includes(toAddIdStr) || room.creator.toString() === toAddIdStr) {
          socket.emit("ERROR", `${usernameToAdd} is already in the room.`);
          return;
        }

        // Add member
        room.members.push(userToAdd._id);
        await room.save();

        // Broadcast updated rooms list to everyone
        await broadcastRooms(io);

        // Notify the added user if they are online to make their socket join the room channel
        const sockets = await io.fetchSockets();
        for (const s of sockets) {
          if (s.data.user?._id === toAddIdStr) {
            s.join(roomId);
            s.emit("ADDED_TO_ROOM", { roomId, roomName: room.name });
            const rooms = await getRoomsForUser(toAddIdStr);
            s.emit(EVENTS.SERVER.ROOMS, rooms);
          }
        }

        // Broadcast updated room details to all room members
        const populatedRoom = await RoomModel.findOne({ roomId })
          .populate("creator members", "username")
          .lean();
        if (populatedRoom) {
          io.to(roomId).emit("ROOM_DETAILS", {
            roomId: populatedRoom.roomId,
            name: populatedRoom.name,
            creator: populatedRoom.creator,
            members: populatedRoom.members,
            isPrivate: populatedRoom.isPrivate
          });
        }

        // Add and broadcast System message
        const date = new Date();
        const time = `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
        
        const systemMessage = new MessageModel({
          roomId,
          username: "System",
          message: `${usernameToAdd} has been added to the room by the owner.`,
          time,
        });
        await systemMessage.save();

        io.to(roomId).emit(EVENTS.SERVER.ROOM_MESSAGE, {
          message: `${usernameToAdd} has been added to the room by the owner.`,
          username: "System",
          time,
        });
      } catch (error) {
        logger.error("Error adding user", error);
      }
    });

    /*
    Kick user from a private room by username
    */
    socket.on("KICK_USER", async ({ roomId, usernameToKick }) => {
      const currentUserId = socket.data.user?._id;
      if (!currentUserId) return;

      try {
        const room = await RoomModel.findOne({ roomId });
        if (!room) {
          socket.emit("ERROR", "Room not found.");
          return;
        }

        if (room.creator.toString() !== currentUserId) {
          socket.emit("ERROR", "Only the room owner can kick members.");
          return;
        }

        // Find user to kick by username
        const userToKick = await UserModel.findOne({ username: String(usernameToKick).trim() });
        if (!userToKick) {
          socket.emit("ERROR", `User "${usernameToKick}" not found.`);
          return;
        }

        const toKickIdStr = userToKick._id.toString();
        if (room.creator.toString() === toKickIdStr) {
          socket.emit("ERROR", "You cannot kick the room owner.");
          return;
        }

        room.members = room.members.filter((m) => m.toString() !== toKickIdStr);
        await room.save();

        // Notify the kicked user's socket if they are online
        const sockets = await io.fetchSockets();
        for (const s of sockets) {
          if (s.data.user?._id === toKickIdStr) {
            s.leave(roomId);
            s.emit("KICKED", { roomId });
            const rooms = await getRoomsForUser(toKickIdStr);
            s.emit(EVENTS.SERVER.ROOMS, rooms);
          }
        }

        // Broadcast updated room details to the remaining members in the room
        const populatedRoom = await RoomModel.findOne({ roomId })
          .populate("creator members", "username")
          .lean();
        if (populatedRoom) {
          io.to(roomId).emit("ROOM_DETAILS", {
            roomId: populatedRoom.roomId,
            name: populatedRoom.name,
            creator: populatedRoom.creator,
            members: populatedRoom.members,
            isPrivate: populatedRoom.isPrivate
          });
        }

        // Add and broadcast System message
        const date = new Date();
        const time = `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

        const systemMessage = new MessageModel({
          roomId,
          username: "System",
          message: `${usernameToKick} has been kicked from the room by the owner.`,
          time,
        });
        await systemMessage.save();

        io.to(roomId).emit(EVENTS.SERVER.ROOM_MESSAGE, {
          message: `${usernameToKick} has been kicked from the room by the owner.`,
          username: "System",
          time,
        });

        // Broadcast updated rooms list to everyone
        await broadcastRooms(io);
      } catch (error) {
        logger.error("Error kicking user", error);
      }
    });

    /*
    Typing Indicator
    */
    socket.on("TYPING", ({ roomId: typeRoomId, username: typeUser, isTyping }) => {
      socket.to(typeRoomId).emit("TYPING", { username: typeUser, isTyping });
    });
  });
}
export default socket;
