import { useEffect, useRef, useState } from "react";
import { useSockets } from "../context/socket.context";
import EVENTS from "../config/events";
import styles from "../styles/Message.module.css";

function MessageContainer() {
  const { socket, messages, roomId, username, setMessages, typingUser, rooms } = useSockets();
  const newMessageRef = useRef<HTMLTextAreaElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [isTypingState, setIsTypingState] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleSendMessage() {
    const message = newMessageRef.current?.value;
    if (!message || !String(message).trim()) {
      return;
    }
    socket.emit(EVENTS.CLIENT.SEND_ROOM_MESSAGE, { roomId, message, username });
    const date = new Date();
    const time = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    setMessages([
      ...messages,
      {
        username: "You",
        message,
        time,
      },
    ]);

    // Turn off typing indicator immediately when sending
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("TYPING", { roomId, username, isTyping: false });
    setIsTypingState(false);

    if (newMessageRef.current) newMessageRef.current.value = "";
  }

  function handleKeyPress() {
    if (!isTypingState) {
      setIsTypingState(true);
      socket.emit("TYPING", { roomId, username, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("TYPING", { roomId, username, isTyping: false });
      setIsTypingState(false);
    }, 2000);
  }

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!roomId) {
    return (
      <div className={styles.emptyWrapper}>
        <p className={styles.emptyText}>Create a new room or join an existing one from the sidebar to start chatting!</p>
      </div>
    );
  }

  const roomName = rooms[roomId] ? rooms[roomId].name : "Room Chat";

  return (
    <div className={styles.wrapper}>
      {/* Active Room Title Header */}
      <div className={styles.chatHeader}>
        <h3 className={styles.chatTitle}># {roomName}</h3>
      </div>

      <div className={styles.messageList}>
        {messages &&
          messages.map(({ message, username: sender, time }, index) => {
            const isMe = sender === "You" || sender === username;
            return (
              <div
                key={index}
                className={`${styles.message} ${isMe ? styles.myMessage : ""}`}
              >
                <div className={styles.messageInner}>
                  <span className={styles.messageSender}>
                    {sender} <span className={styles.messageTime}>{time}</span>
                  </span>
                  <span className={styles.messageBody}>{message}</span>
                </div>
              </div>
            );
          })}
        {/* Typing HUD */}
        {typingUser && typingUser !== username && (
          <div className={styles.typingHUD}>
            <span className={styles.typingDot} />
            <em>{typingUser} is typing...</em>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      <div className={styles.messageBox}>
        <textarea
          rows={1}
          placeholder="Type a message here..."
          ref={newMessageRef}
          onKeyDown={handleKeyPress}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

export default MessageContainer;
