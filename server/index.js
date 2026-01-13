const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: "*" }
});

// Import Drizzle and Schema
const { db } = require('./db');
const { rooms } = require('./db/schema');
const { eq } = require('drizzle-orm');

// We still use this to keep track of active socket IDs in rooms for the Mesh handshake
const roomParticipants = {}; 

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", async ({ roomID, username }) => {
    try {
      // 1. DATABASE CHECK: See if room exists in MySQL
      let room = await db.select().from(rooms).where(eq(rooms.roomId, roomID));

      if (room.length === 0) {
        // First person joins -> Create room in MySQL and make them Admin
        await db.insert(rooms).values({ 
          roomId: roomID, 
          adminId: 1 // In a full app, this would be the logged-in user's ID
        });
        socket.emit("admin-status", true);
        socket.data.isAdmin = true;
      }

      // 2. WAITING ROOM LOGIC: Notify Admin for permission
      // For this simplified mesh, we'll auto-approve, but emit the 'all-users' list
      if (!roomParticipants[roomID]) {
        roomParticipants[roomID] = [];
      }

      // Tell the new user about everyone else already in the mesh
      const otherUsers = roomParticipants[roomID];
      socket.emit("all-users", otherUsers);

      // Add this new user to the room list
      roomParticipants[roomID].push(socket.id);
      socket.join(roomID);

    } catch (err) {
      console.error("Database Error:", err);
    }
  });

  // --- MESH SIGNALING LOGIC ---
  // Step 1: New user sends signal to everyone already in the room
  socket.on("sending-signal", (payload) => {
    io.to(payload.userToSignal).emit('user-joined', { 
      signal: payload.signal, 
      callerID: payload.callerID 
    });
  });

  // Step 2: Existing users return their signal to the new user
  socket.on("returning-signal", (payload) => {
    io.to(payload.callerID).emit('receiving-returned-signal', { 
      signal: payload.signal, 
      id: socket.id 
    });
  });

  // --- COLLABORATION ---
  socket.on("drawing", (data) => {
    socket.broadcast.emit("drawing", data);
  });

  // --- CLEANUP ---
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Remove user from the roomParticipants lists
    for (const roomID in roomParticipants) {
      roomParticipants[roomID] = roomParticipants[roomID].filter(id => id !== socket.id);
      socket.to(roomID).emit("user-left", socket.id);
    }
  });
});

server.listen(5000, () => console.log("Nexus Backend running on port 5000"));