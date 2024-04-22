import { useRef, useEffect } from "react";
import MessageContainer from "../../container/Messages";
import Room from "../../container/Room";
import { useSockets } from "../../context/socket.context";

const Home = () => {
  const { socket, username, setUsername } = useSockets();
  const usernameRef = useRef(null);

  function handleSetUsername() {
    const value = usernameRef.current.value;
    if (!value) {
      return;
    }
    setUsername(value);
    localStorage.setItem("username", value);
  }

  useEffect(() => {
    if (usernameRef) {
      usernameRef.current.value = localStorage.getItem("username") || "";
    }
  });

  return (
    <div>
      {!username && (
        <div className="username">
          {" "}
          <input placeholder="username" ref={usernameRef} />
          <button onClick={handleSetUsername}>Start</button>
        </div>
      )}
      {username && (
        <>
          <Room />
          <MessageContainer />
        </>
      )}
    </div>
  );
};
export default Home;
