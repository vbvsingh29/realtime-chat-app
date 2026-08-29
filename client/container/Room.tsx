import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import { useRef, useState } from "react";
import styles from "../styles/Room.module.css";

function Room() {
  const { socket, roomId, rooms, username, creatorId } = useSockets();
  const newRoomRef = useRef<HTMLInputElement>(null);
  const joinByIdRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  function handleCreateRoom() {
    const roomName = newRoomRef.current?.value;
    if (!roomName || !String(roomName).trim()) return;

    socket.emit(EVENTS.CLIENT.CREATE_ROOM, { roomName, creatorId });
    if (newRoomRef.current) newRoomRef.current.value = "";
  }

  function handleJoinRoom(key: string) {
    if (key === roomId) return;
    socket.emit(EVENTS.CLIENT.JOIN_ROOM, key);
  }

  function handleJoinById() {
    const id = joinByIdRef.current?.value.trim();
    if (!id) return;
    socket.emit(EVENTS.CLIENT.JOIN_ROOM, id);
    if (joinByIdRef.current) joinByIdRef.current.value = "";
  }

  function handleCopyRoomId() {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    localStorage.removeItem("chat_token");
    window.location.reload();
  }

  return (
    <nav className={styles.wrapper}>
      {/* Current User Info */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.userDot} />
          <span className={styles.usernameText}>{username}</span>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Log Out
        </button>
      </div>

      {/* Join Room by ID */}
      <div className={styles.joinByIdWrapper}>
        <input placeholder="Paste Room ID to Join" ref={joinByIdRef} />
        <button className="cta" onClick={handleJoinById}>
          Join ID
        </button>
      </div>

      {/* Create Room */}
      <div className={styles.createRoomWrapper}>
        <input placeholder="Create Room Name" ref={newRoomRef} />
        <button className="cta" onClick={handleCreateRoom}>
          Create
        </button>
      </div>

      {/* Current Room HUD */}
      {roomId && (
        <div className={styles.currentRoomBox}>
          <p className={styles.currentRoomLabel}>Active Room</p>
          <h4 className={styles.currentRoomVal}>
            {rooms[roomId] ? rooms[roomId].name : "Custom Room"}
          </h4>
          <p className={styles.roomIdText}>ID: {roomId}</p>
          <button onClick={handleCopyRoomId} className={styles.copyBtn}>
            {copied ? "Copied!" : "Copy Room ID"}
          </button>
        </div>
      )}

      {/* Room list */}
      <h3 className={styles.listHeading}>Available Rooms</h3>
      <ul className={styles.roomList}>
        {Object.keys(rooms).map((key) => {
          return (
            <li key={key}>
              <button
                className={key === roomId ? styles.activeRoomBtn : ""}
                disabled={key === roomId}
                title={`Join ${rooms[key].name}`}
                onClick={() => handleJoinRoom(key)}
              >
                # {rooms[key].name}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Contact Section */}
      <div className={styles.contactFooter}>
        <a href="mailto:vbvsingh2905@gmail.com" className={styles.contactLink}>
          📧 Contact Developer
        </a>
      </div>
    </nav>
  );
}

export default Room;
