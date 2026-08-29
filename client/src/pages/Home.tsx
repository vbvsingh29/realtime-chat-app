import { useRef, useState, useEffect } from "react";
import MessageContainer from "../../container/Messages";
import Room from "../../container/Room";
import { useSockets } from "../../context/socket.context";
import { SOCKET_URL } from "../../config/default";
import styles from "../../styles/Home.module.css";

const Home = () => {
  const { username, setUsername, setCreatorId } = useSockets();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [userVal, setUserVal] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const url = isRegister
      ? `${SOCKET_URL}/api/auth/register`
      : `${SOCKET_URL}/api/auth/login`;

    const bodyObj = isRegister
      ? { username: userVal, email, password: pass }
      : { email, password: pass };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyObj),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      localStorage.setItem("chat_token", data.token);
      const decoded = decodeJwt(data.token);
      if (decoded) {
        setUsername(decoded.username);
        setCreatorId(decoded._id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    }
  };

  return (
    <div className={styles.wrapper}>
      {!username ? (
        <div className={styles.authWrapper}>
          <div className={styles.authCard}>
            <h2 className={styles.authTitle}>
              {isRegister ? "Create an Account" : "Log In to Chat"}
            </h2>
            {errorMsg && <p className={styles.authError}>{errorMsg}</p>}
            <form onSubmit={handleAuthSubmit} className={styles.authForm}>
              {isRegister && (
                <div className={styles.inputGroup}>
                  <label>Username</label>
                  <input
                    type="text"
                    required
                    placeholder="john_doe"
                    value={userVal}
                    onChange={(e) => setUserVal(e.target.value)}
                  />
                </div>
              )}
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
              </div>
              <button type="submit" className={styles.authBtn}>
                {isRegister ? "Sign Up" : "Log In"}
              </button>
            </form>
            <p className={styles.authToggle}>
              {isRegister ? "Already have an account?" : "New to Chat App?"}{" "}
              <span onClick={() => { setIsRegister(!isRegister); setErrorMsg(""); }}>
                {isRegister ? "Log In" : "Sign Up"}
              </span>
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.container}>
          <Room />
          <MessageContainer />
        </div>
      )}
    </div>
  );
};

export default Home;
