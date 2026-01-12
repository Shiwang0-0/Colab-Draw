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

// ----------- Deployment  ------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const _dirname1 = path.resolve(__dirname, '..')

if(process.env.NODE_ENV=='production'){
    app.use(express.static(path.join(_dirname1, "client", "dist")));

    app.get('*',(req,res)=>{
        res.sendFile(path.resolve(_dirname1,"client","dist","index.html"));
    });
}
else{
    app.get("/",(req,res)=>{
        res.send("Success");
    })
}

// ----------- Deployment  ------------

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const roomMembers = new Map();

const emitRoomCount = (room) => {
  const count = roomMembers.get(room)?.size ?? 0;
  io.to(room).emit("roomusercount", { roomName: room, count });
};

io.on('connection', (socket) => {
  console.log(`user connected ${socket.id}`);

  const joinedRooms = new Set();

  socket.on('joinroom', (room) => {
    console.log(`Socket ${socket.id} joined room ${room}`);
    socket.join(room);

    if (!roomMembers.has(room)) roomMembers.set(room, new Set());
    roomMembers.get(room).add(socket.id);
    joinedRooms.add(room);

    emitRoomCount(room);
  });

  socket.on("leaveroom", (room) => {
    socket.leave(room);
    const members = roomMembers.get(room);
    if (members) {
      members.delete(socket.id);
      if (!members.size) {
        roomMembers.delete(room);
      } else {
        emitRoomCount(room);
      }
    }
    joinedRooms.delete(room);
  });

  socket.on("drawsomething", ({ roomName, color, prevCoordinate, currCoordinate }) => {
    socket.to(roomName).emit("drawsomething", { color, prevCoordinate, currCoordinate });
  });

  socket.on("drawshape", ({ roomName, shape, start, end, color }) => {
    socket.to(roomName).emit("drawshape", { shape, start, end, color });
  });

  socket.on("drawcomplete", (roomName) => {
    socket.to(roomName).emit("drawcomplete");
  });

  socket.on("clientready", (room) => {
    socket.to(room).emit("getcanvasstate");
  });

  socket.on("canvasstate", (data) => {
    const { roomName, state } = data;
    socket.to(roomName).emit('canvasstatefromserver', state);
  });

  socket.on("clear", (roomName) => {
    socket.to(roomName).emit("clear");
  });

  socket.on("undo", ({ roomName, state }) => {
    socket.to(roomName).emit("undo", state);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);

    joinedRooms.forEach((room) => {
      const members = roomMembers.get(room);
      if (members) {
        members.delete(socket.id);
        if (!members.size) {
          roomMembers.delete(room);
        } else {
          emitRoomCount(room);
        }
      }
    });
  });
})

server.listen(port, () => {
  console.log("server listening on 3000")
})