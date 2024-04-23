import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import { useRef } from "react";
import styles from "../styles/Room.module.css";

function Room() {
  const { socket, roomId, rooms } = useSockets();
  const newRoomRef = useRef(null);

  function handleCreateRoom() {
    const roomName = newRoomRef.current.value;
    if (!String(roomName).trim()) return;

    console.log(socket, "EMITED", roomName);
    //emit room created event
    socket.emit(EVENTS.CLIENT.CREATE_ROOM, roomName);

    // set room name input to empty string
    newRoomRef.current.value = "";
  }

  function handleJoinRoom(key) {
    if (key === roomId) return;
    socket.emit(EVENTS.CLIENT.JOIN_ROOM, key);
  }

  return (
    <nav className={styles.wrapper}>
      <div className={styles.createRoomWrapper}>
        <input placeholder="Room Name" ref={newRoomRef} />
        <button className="cta" onClick={handleCreateRoom}>
          Create Room
        </button>
      </div>

      <ul className={styles.roomList}>
        {Object.keys(rooms).map((key) => {
          return (
            <div key={key}>
              <button
                disabled={key === roomId}
                title={`Join ${rooms[key].name}`}
                onClick={() => handleJoinRoom(key)}
              >
                {rooms[key].name}
              </button>
            </div>
          );
        })}
      </ul>
    </nav>
  );
}
export default Room;
