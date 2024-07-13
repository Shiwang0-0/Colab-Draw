import Button from '@mui/material/Button';
import React, { useContext, useEffect } from 'react';
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";
import { RoomContext } from "../Contexts/Room.jsx";
import { getSocket } from '../Contexts/Socket.jsx';
import { useDraw } from '../hooks/useDraw.jsx';
import drawSomething from '../util/drawSomething.js';
import { Typography } from '@mui/material';



const Canvas = () => {
  const socket = getSocket()

  const { canvasRef, onMouseDown, clear } = useDraw(createSomething);
  const [color, setColor] = useColor("#000000");

  const context = useContext(RoomContext);
  const { roomName } = context;

  useEffect(() => {


    const ctx = canvasRef.current?.getContext('2d')
    socket.emit("clientready", roomName)

    socket.on("getcanvasstate", () => {
      if (!canvasRef.current?.toDataURL())
        return;

      socket.emit("canvasstate", { roomName, state: canvasRef.current.toDataURL() });
    });

    socket.on("canvasstatefromserver", (state) => {
      const img = new Image();
      img.src = state;
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
      };
    });

    socket.on("drawsomething", ({ prevCoordinate, currCoordinate, color }) => {
      if (!ctx)
        return;
      drawSomething({ ctx, color, prevCoordinate, currCoordinate })
    })

    socket.on("clear", clear)

    return () => {
      socket.off("drawsomething")
      socket.off("getcanvasstate")
      socket.off("canvasstatefromserver")
      socket.off("clear")
    }

  }, [canvasRef, roomName]);

  function createSomething({ ctx, prevCoordinate, currCoordinate }) {
    socket.emit("drawsomething", ({ roomName, color, prevCoordinate, currCoordinate }));
    drawSomething({ ctx, color, prevCoordinate, currCoordinate });
  }


  return (
  <>
  <Typography>You are in Room: {roomName}</Typography>
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "92vh" }}>
      
      <ColorPicker color={color} onChange={setColor} />
      <Button sx={{ color: "black" }}
        onClick={() => {
        clear(); 
        socket.emit("clear", roomName)
      }}>
        Clear
      </Button>
      <canvas onMouseDown={onMouseDown} ref={canvasRef} width={900} height={600} style={{ border: "2px solid black" }} />
    </div>
  </>
  )
}

export default Canvas
