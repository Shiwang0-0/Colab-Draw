import { Box, Button, TextField, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { RoomContext } from "../Contexts/Room";
import { getSocket } from '../Contexts/Socket';


const Home = () => {
  const socket = getSocket();
  const navigate = useNavigate();
  const [socketId, setSocketId] = useState("");

  const { roomName, setRoomName } = useContext(RoomContext);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('connected', socket.id);
      setSocketId(socket.id)
    })
  });

  const joinRoomHandler = (e) => {
    e.preventDefault();
    socket.emit("joinroom", roomName);
    navigate("/canvas");
  };



  return (
    <>
      <Box>
        <Typography>your socket Id: {socketId}</Typography>
        <Typography>Join Room</Typography>
        <form onSubmit={joinRoomHandler}>
          <h5>Join Room</h5>
          <TextField
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            id="outlined-basic"
            label="Room Name"
            variant="outlined"
          />
          <Button type="submit" variant="contained" color="primary">
            Join
          </Button>
        </form>
      </Box>
      <Box>
      </Box>
    </>
  )
}

export default Home
