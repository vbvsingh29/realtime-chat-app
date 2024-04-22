import { useRef } from "react";
import { useSockets } from "../context/socket.context";
import EVENTS from "../config/events";

function MessageContainer() {
  const { socket, messages, roomId, username, setMessages } = useSockets();
  const newMessageRef = useRef(null);

  function handleSendMessage() {
    const message = newMessageRef.current.value;
    if (!String(message).trim()) {
      return;
    }
    socket.emit(EVENTS.CLIENT.SEND_ROOM_MESSAGE, { roomId, message, username });
console.log(messages,"MMMM")
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

  if (!roomId) {
    return <div />;
  }

  return (
    <div>
      {messages &&
        messages.map(({ message }, index) => {
          return <p key={index}>{message}</p>;
        })}

      <div>
        <textarea
          rows={1}
          placeholder="Tell Us What you are thinkinh"
          ref={newMessageRef}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
export default MessageContainer;
