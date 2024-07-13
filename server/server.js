import cors from "cors";
import express from 'express';
import { createServer } from "http";
import { Server } from 'socket.io';


const port = 3000;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

io.on('connection', (socket) => {
  console.log(`user connected ${socket.id}`);

  socket.on('joinroom', (room) => {
    console.log(`Socket ${socket.id} joined room ${room}`);
    socket.join(room);
  });

  socket.on("drawsomething", ({ roomName, color, prevCoordinate, currCoordinate }) => {
    socket.to(roomName).emit("drawsomething", { color, prevCoordinate, currCoordinate });
  });


  socket.on("clientready", (room) => {
    socket.to(room).emit("getcanvasstate"); // Emit to the correct room
  });

  socket.on("canvasstate", (data) => {
    const { roomName, state } = data;
    socket.to(roomName).emit('canvasstatefromserver', state);
  });

  socket.on("clear", (roomName) => {
    socket.to(roomName).emit("clear");
  })

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
})

server.listen(port, () => {
  console.log("server listening on 3000")
})  
