import { Server, Socket } from "socket.io";
import logger from "./utils/logger";
import { nanoid } from "nanoid";

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

const rooms: Record<string, { name: string }> = {};
function socket({ io }: { io: Server }) {
  logger.info(`Socket Enabled`);

  io.on(EVENTS.connection, (socket: Socket) => {
    logger.info(`User Connected ${socket.id}`);

    /*
    when a user creates new room
    */
    socket.on(EVENTS.CLIENT.CREATE_ROOM, (roomName) => {
      console.log({ roomName });

      //create A roomId
      const roomId = nanoid();

      // Add new Room to the rooms object
      rooms[roomId] = {
        name: roomName,
      };

      socket.join(roomId);

      // broadcast an event saying there is new room
      socket.broadcast.emit(EVENTS.SERVER.ROOMS, rooms);

      // emit back to room creator
      socket.emit(EVENTS.SERVER.ROOMS, rooms);

      // emit event back the room creator syaing new person has joined
      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
    });

    /*
    when a user sends a message
     */
    socket.on(
      EVENTS.CLIENT.SEND_ROOM_MESSAGE,
      ({ roomId, message, username }) => {
        const date = new Date();
        socket.to(roomId).emit(EVENTS.SERVER.ROOM_MESSAGE, {
          message,
          username,
          time: `${date.getHours()}:${date.getMinutes()}`,
        });
      }
    );

    /*
    When a user joins a room
     */
    socket.on(EVENTS.CLIENT.JOIN_ROOM, (roomId) => {
      socket.join(roomId);
      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
    });
  });
}
export default socket;
