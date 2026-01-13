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
      // 1. DATABASE CHECK: See if room exists
      let room = await db.select().from(rooms).where(eq(rooms.roomId, roomID));

      if (room.length === 0) {
        await db.insert(rooms).values({ 
          roomId: roomID, 
          adminId: socket.id 
        });
        socket.emit("admin-status", true);
      } else {
        // 2. LOAD PERSISTED DATA: Send the saved drawing to the user joining
        if (room[0].whiteboardData) {
          socket.emit("load-whiteboard", room[0].whiteboardData);
        }
      }

      // 3. MESH SETUP
      if (!roomParticipants[roomID]) {
        roomParticipants[roomID] = [];
      }

      const otherUsers = roomParticipants[roomID];
      socket.emit("all-users", otherUsers);

      roomParticipants[roomID].push(socket.id);
      socket.join(roomID);

    } catch (err) {
      console.error("Database Error:", err);
    }
  });

  // --- MESH SIGNALING ---
  socket.on("sending-signal", (payload) => {
    io.to(payload.userToSignal).emit('user-joined', { 
      signal: payload.signal, 
      callerID: payload.callerID 
    });
  });

  socket.on("returning-signal", (payload) => {
    io.to(payload.callerID).emit('receiving-returned-signal', { 
      signal: payload.signal, 
      id: socket.id 
    });
  });

  // --- COLLABORATION & DB SAVING ---
  socket.on("drawing", async (data) => {
    // Broadcast live drawing to everyone else in the room
    socket.to(data.roomID).emit("drawing", data);

    // 4. PERSIST TO MARIADB: Update the record with the latest canvas state
    // 'data.fullCanvasState' comes from the frontend canvas.toDataURL()
    if (data.fullCanvasState) {
      try {
        await db.update(rooms)
          .set({ whiteboardData: data.fullCanvasState })
          .where(eq(rooms.roomId, data.roomID));
      } catch (err) {
        console.error("Error saving whiteboard:", err);
      }
    }
  });

  // --- CLEANUP ---
  socket.on("disconnect", () => {
    for (const roomID in roomParticipants) {
      roomParticipants[roomID] = roomParticipants[roomID].filter(id => id !== socket.id);
      socket.to(roomID).emit("user-left", socket.id);
    }
  });
});

server.listen(5000, () => console.log("Nexus Backend running on port 5000"));