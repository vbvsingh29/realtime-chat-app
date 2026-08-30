import { io, Socket } from "socket.io-client";
import { createContext, useContext, useState, useEffect } from "react";
import { SOCKET_URL } from "../config/default";
import EVENTS from "../config/events";

interface Context {
  socket: Socket;
  username?: string;
  setUsername: (name: string) => void;
  messages?: { message: string; username: string; time: string }[];
  setMessages: Function;
  roomId?: string;
  rooms: object;
  typingUser: string;
  setTypingUser: (val: string) => void;
  creatorId: string;
  setCreatorId: (val: string) => void;
  roomDetails?: { roomId: string; name: string; creator: { _id: string; username: string }; members: { _id: string; username: string }[]; isPrivate: boolean } | null;
}

const socket = io(SOCKET_URL, { autoConnect: false });
const socketContext = createContext<Context>({
  socket,
  setUsername: () => false,
  setMessages: () => false,
  rooms: {},
  messages: [],
  typingUser: "",
  setTypingUser: () => {},
  creatorId: "",
  setCreatorId: () => {},
  roomDetails: null,
});

function SocketProvider(props: any) {
  const [username, setUsername] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState({});
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [roomDetails, setRoomDetails] = useState<any>(null);

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("chat_token");
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.username) {
        setUsername(decoded.username);
        setCreatorId(decoded._id);
      }
    }
  }, []);

  useEffect(() => {
    window.onfocus = function () {
      document.title = "Chat App";
    };
  }, []);

  // Connect/disconnect socket based on authentication status
  useEffect(() => {
    const token = localStorage.getItem("chat_token");
    if (creatorId && token) {
      socket.auth = { token };
      if (!socket.connected) {
        socket.connect();
      }
    } else {
      socket.disconnect();
    }
  }, [creatorId]);

  useEffect(() => {
    socket.on(EVENTS.SERVER.ROOMS, (value) => {
      setRooms(value);
    });

    socket.on(EVENTS.SERVER.JOINED_ROOM, (value) => {
      setRoomId(value);
      setMessages([]);
    });

    socket.on("ROOM_HISTORY", (history) => {
      setMessages(history);
    });

    socket.on("ROOM_DETAILS", (details) => {
      setRoomDetails(details);
    });

    socket.on("TYPING", ({ username: typingName, isTyping }) => {
      if (isTyping) {
        setTypingUser(typingName);
      } else {
        setTypingUser("");
      }
    });

    socket.on("KICKED", () => {
      alert("You have been kicked from this room by the owner.");
      setRoomId("");
      setRoomDetails(null);
      setMessages([]);
    });

    socket.on("ERROR", (errorMsg) => {
      alert(errorMsg);
    });

    return () => {
      socket.off(EVENTS.SERVER.ROOMS);
      socket.off(EVENTS.SERVER.JOINED_ROOM);
      socket.off("ROOM_HISTORY");
      socket.off("ROOM_DETAILS");
      socket.off("TYPING");
      socket.off("KICKED");
      socket.off("ERROR");
    };
  }, []);

  useEffect(() => {
    socket.on(EVENTS.SERVER.ROOM_MESSAGE, ({ message, username: msgUser, time }) => {
      if (!document.hasFocus()) {
        document.title = "New Message...";
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        { message, username: msgUser, time },
      ]);
    });

    return () => {
      socket.off(EVENTS.SERVER.ROOM_MESSAGE);
    };
  }, [socket]);

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
        typingUser,
        setTypingUser,
        creatorId,
        setCreatorId,
        roomDetails,
      }}
      {...props}
    />
  );
}

export const useSockets = () => useContext(socketContext);
export default SocketProvider;
