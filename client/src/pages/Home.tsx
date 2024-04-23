import { useRef, useEffect } from "react";
import MessageContainer from "../../container/Messages";
import Room from "../../container/Room";
import { useSockets } from "../../context/socket.context";
import styles from "../../styles/Home.module.css";

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
    if (usernameRef)
      usernameRef.current.value = localStorage.getItem("username") || "";
  }, []);

  return (
    <div className={styles.wrapper}>
      {!username && (
        <div className={styles.usernameWrapper}>
          <div className={styles.usernameInner}>
            {" "}
            <input placeholder="username" ref={usernameRef} />
            <button className="cta" onClick={handleSetUsername}>
              Start
            </button>
          </div>
        </div>
      )}
      {username && (
        <div className={styles.container}>
          <Room />
          <MessageContainer />
        </div>
      )}
    </div>
  );
};
export default Home;
