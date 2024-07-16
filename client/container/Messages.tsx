import { useEffect, useRef } from "react";
import { useSockets } from "../context/socket.context";
import EVENTS from "../config/events";
import styles from "../styles/Message.module.css";

function MessageContainer() {
  const { socket, messages, roomId, username, setMessages } = useSockets();
  const newMessageRef = useRef(null);
  const messageEndRef = useRef(null);

  function handleSendMessage() {
    const message = newMessageRef.current.value;
    if (!String(message).trim()) {
      return;
    }
    socket.emit(EVENTS.CLIENT.SEND_ROOM_MESSAGE, { roomId, message, username });
    const date = new Date();
    setMessages([
      ...messages,
      {
        username: "You",
        message,
        time: `${date.getHours()}:${date.getMinutes()}`,
      },
    ]);
    newMessageRef.current.value = "";
  }

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behaviour: "smooth" });
  }, [messages]);

  if (!roomId) {
    return <div />;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messageList}>
        {messages &&
          messages.map(({ message, username, time }, index) => {
            return (
              <div key={index} className={styles.message}>
                <div key={index} className={styles.messageInner}>
                  <span className={styles.messageSender}>
                    {username} - {time}
                  </span>
                  <span className={styles.messageBody}>{message}</span>
                </div>
              </div>
            );
          })}
        <div ref={messageEndRef} />
      </div>
      <div className={styles.messageBox}>
        <textarea
          rows={1}
          placeholder="Tell Us What you are thinking"
          ref={newMessageRef}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
export default MessageContainer;
