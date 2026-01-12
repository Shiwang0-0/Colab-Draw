import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
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
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%)", padding: 2 }}>
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 440, padding: 4, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={700}>Colab Draw</Typography>
          <Typography variant="body1" color="text.secondary">
            Create or join a room to start drawing together.
          </Typography>

          <Typography variant="overline" color="text.secondary">
            Connected as: {socketId || "connecting..."}
          </Typography>

          <form onSubmit={joinRoomHandler}>
            <Stack spacing={2}>
              <TextField
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                id="outlined-basic"
                label="Room Name"
                variant="outlined"
                fullWidth
                required
              />
              <Button type="submit" variant="contained" size="large" disableElevation>
                Enter Canvas
              </Button>
            </Stack>
          </form>

          <Typography variant="body2" color="text.secondary">
            Tip: share the room name with collaborators to draw in real time.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}

export default Home
