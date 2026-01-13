const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: "*" } // Allows the React app to connect
});

// Simple In-memory storage for the session
const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomID) => {
    if (users[roomID]) {
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    
    // If there's another user in the room, tell them to connect
    const otherUser = users[roomID].find(id => id !== socket.id);
    if (otherUser) {
      socket.emit("other-user", otherUser);
      socket.to(otherUser).emit("user-joined", socket.id);
    }
  });

  // Signaling: Passing WebRTC handshake data between peers
  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", { signal: payload.signal, from: socket.id });
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", { signal: payload.signal, from: socket.id });
  });

  // Collaboration: Whiteboard synchronization
  socket.on("drawing", (data) => {
    socket.broadcast.emit("drawing", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    // Clean up rooms logic can be added here
  });
});

server.listen(5000, () => console.log("Signaling Server running on port 5000"));