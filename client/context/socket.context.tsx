import io, { Socket } from "socket.io-client";
import { createContext, useContext, useState, useEffect } from "react";
import { SOCKET_URL } from "../config/default";
import EVENTS from "../config/events";

interface Context {
  socket: Socket;
  username?: string;
  setUsername: Function;
  messages?: { message: string; username: string; time: string }[];
  setMessages: Function;
  roomId?: string;
  rooms: object;
}
const socket = io(SOCKET_URL);
console.log(socket, "SOCKET CONTEXT");
const socketContext = createContext<Context>({
  socket,
  setUsername: () => false,
  setMessages: () => false,
  rooms: {},
  messages: [],
});

function SocketProvider(props: any) {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState({});
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    window.onfocus = function () {
      document.title = "Chat App";
    };
  });

  socket.on(EVENTS.SERVER.ROOMS, (value) => {
    setRooms(value);
  });

  socket.on(EVENTS.SERVER.JOINED_ROOM, (value) => {
    setRoomId(value);
    setMessages([]);
  });

  socket.on(EVENTS.SERVER.ROOM_MESSAGE, ({ message, username, time }) => {
    if (!document.hasFocus()) {
      document.title = "New Message...";
    }
    setMessages([...message, { message, username, time }]);
  });
  return (
    <socketContext.Provider
      value={{
        socket,
        username,
        setUsername,
        rooms,
        roomId,
        messages,
        setMessages,
      }}
      {...props}
    />
  );
}

export const useSockets = () => useContext(socketContext);
export default SocketProvider;