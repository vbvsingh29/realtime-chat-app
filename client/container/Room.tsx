import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import { useRef } from "react";

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
    <nav>
      <div>
        <input placeholder="Room Name" ref={newRoomRef} />
        <button onClick={handleCreateRoom}>Create Room</button>
      </div>
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
    </nav>
  );
}
export default Room;
