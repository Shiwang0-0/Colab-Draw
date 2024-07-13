import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RoomProvider } from "./Contexts/Room";
import { SocketProvider } from "./Contexts/Socket";
import Canvas from "./pages/Canvas";
import Home from "./pages/Home";

const App=()=> {


  return (
    <>
    <SocketProvider>
      <RoomProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/canvas" element={<Canvas />} />
          </Routes>
        </BrowserRouter>
      </RoomProvider>
    </SocketProvider>
    </>
  )
}

export default App
