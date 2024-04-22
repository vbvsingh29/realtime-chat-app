import SocketProvider from "../context/socket.context";
import Home from "./pages/Home";
import { Route, BrowserRouter, Routes } from "react-router-dom";

const App = () => {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
};

export default App;
