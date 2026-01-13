import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import Auth from "./components/Auth";
import VideoGrid from "./components/VideoGrid";
import Whiteboard from "./components/WhiteBoard";
import FileShare from "./components/FileShare";
import Controls from "./components/Controls";

// Dynamic Room ID (You can change this to a dynamic state later)
const ROOM_ID = "main-room";
const socket = io.connect("http://localhost:5000");

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState("");
  const [roomID, setRoomID] = useState("");
  const [stream, setStream] = useState(null);
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  
  // --- MESH NETWORK STATES ---
  const [peers, setPeers] = useState([]); // Array of peer objects for rendering
  const userVideo = useRef();
  const peersRef = useRef([]); // Ref to keep track of peers for signaling

  useEffect(() => {
    if (!isAuth) return;

    // 1. Get Media First
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (userVideo.current) userVideo.current.srcObject = currentStream;

      // 2. Tell Server we are joining
      socket.emit("join-room", { roomID: ROOM_ID, username });

      // 3. Receive list of users already in the room
      socket.on("all-users", (users) => {
        const peers = [];
        users.forEach((userID) => {
          const peer = createPeer(userID, socket.id, currentStream);
          peersRef.current.push({ peerID: userID, peer });
          peers.push({ peerID: userID, peer });
        });
        setPeers(peers);
      });

      // 4. Handle a new user joining the room
      socket.on("user-joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, currentStream);
        peersRef.current.push({ peerID: payload.callerID, peer });
        setPeers((prev) => [...prev, { peerID: payload.callerID, peer }]);
      });

      // 5. Complete the handshake
      socket.on("receiving-returned-signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        if (item) item.peer.signal(payload.signal);
      });

      // 6. Handle user leaving
      socket.on("user-left", (id) => {
        const peerObj = peersRef.current.find(p => p.peerID === id);
        if (peerObj) peerObj.peer.destroy();
        const remainingPeers = peersRef.current.filter(p => p.peerID !== id);
        peersRef.current = remainingPeers;
        setPeers(remainingPeers);
      });
    });

    return () => socket.off();
  }, [isAuth]);

  // --- MESH HELPER FUNCTIONS ---

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });
    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  // --- CONTROLS ---

  const toggleMic = () => {
    stream.getAudioTracks()[0].enabled = !micActive;
    setMicActive(!micActive);
  };

  const toggleCamera = () => {
    stream.getVideoTracks()[0].enabled = !cameraActive;
    setCameraActive(!cameraActive);
  };

  const shareScreen = () => {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((screenStream) => {
      const screenTrack = screenStream.getTracks()[0];
      peersRef.current.forEach(({ peer }) => {
        peer.replaceTrack(stream.getVideoTracks()[0], screenTrack, stream);
      });
      userVideo.current.srcObject = screenStream;
      screenTrack.onended = () => {
        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(screenTrack, stream.getVideoTracks()[0], stream);
        });
        userVideo.current.srcObject = stream;
      };
    });
  };

  const endCall = () => window.location.reload();

  if (!isAuth) return <Auth setUsername={setUsername} setIsAuth={setIsAuth} />;
  if (!isAuth) {
    return (
      <Auth 
        setUsername={setUsername} 
        setRoomID={setRoomID} 
        setIsAuth={setIsAuth} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 flex flex-col">
      <nav className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0b0e14]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">N</div>
          <span className="font-bold tracking-tight">NEXUS <span className="text-indigo-500 text-xs font-black">PRO</span></span>
        </div>
      </nav>

      <main className="flex-1 relative p-6 grid grid-cols-12 gap-6 overflow-y-auto pb-32">
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
          <VideoGrid 
            userVideo={userVideo} 
            peers={peers} // Passing the array of peers
            username={username} 
          />
          <Whiteboard socket={socket} roomId={ROOM_ID} />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <FileShare peers={peers} />
        </div>
      </main>

      <Controls 
        micActive={micActive} 
        cameraActive={cameraActive} 
        toggleMic={toggleMic} 
        toggleCamera={toggleCamera} 
        shareScreen={shareScreen} 
        endCall={endCall} 
      />
    </div>
  );
}

export default App;