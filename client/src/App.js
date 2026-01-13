import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

// ... other imports (VideoGrid, Controls, etc.)

function App() {
  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]); // Internal reference to avoid state lag
  const [stream, setStream] = useState(null);

  useEffect(() => {
    socketRef.current = io.connect("http://localhost:5000");

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
      setStream(s);
      userVideo.current.srcObject = s;

      socketRef.current.emit("join-room", { roomID, username });

      // 1. Someone is already in the room. We initiate connection to them.
      socketRef.current.on("all-users", (users) => {
        const peers = [];
        users.forEach((userID) => {
          const peer = createPeer(userID, socketRef.current.id, s);
          peersRef.current.push({
            peerID: userID,
            peer,
          });
          peers.push({
            peerID: userID,
            peer,
          });
        });
        setPeers(peers);
      });

      // 2. We are in the room, and someone NEW just joined. We receive their signal.
      socketRef.current.on("user-joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, s);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        });

        const peerObj = {
          peer,
          peerID: payload.callerID,
        };

        setPeers((users) => [...users, peerObj]);
      });

      // 3. Receiving the returned signal to complete the handshake
      socketRef.current.on("receiving-returned-signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });

      // 4. Handle User Disconnect
      socketRef.current.on("user-left", id => {
        const peerObj = peersRef.current.find(p => p.peerID === id);
        if(peerObj) peerObj.peer.destroy(); // Clean up memory
        const remainingPeers = peersRef.current.filter(p => p.peerID !== id);
        peersRef.current = remainingPeers;
        setPeers(remainingPeers);
      });
    });
  }, []);

  // --- Helper Functions for Mesh Networking ---

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending-signal", { userToSignal, callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning-signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  // ... rest of your component
}