import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import Auth from "./components/Auth";
import VideoGrid from "./components/VideoGrid";
import Whiteboard from "./components/WhiteBoard";
import FileShare from "./components/FileShare";
import Controls from "./components/Controls";

// Connect to the backend
const socket = io.connect("http://localhost:5000");

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState("");
  const [roomID, setRoomID] = useState(""); 
  const [stream, setStream] = useState(null);
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  
  // --- MESH NETWORK STATES ---
  const [peers, setPeers] = useState([]); 
  const userVideo = useRef();
  const peersRef = useRef([]); 

  useEffect(() => {
    // Only run WebRTC logic if authenticated
    if (!isAuth || !roomID) return;

    // 1. Access Camera and Microphone
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (userVideo.current) userVideo.current.srcObject = currentStream;

        // 2. Attach listeners before joining so we don't miss server responses
        socket.on("all-users", (users) => {
          const peersArr = [];
          users.forEach((userID) => {
            if (userID === socket.id) return;

            const peer = createPeer(userID, socket.id, currentStream);
            peersRef.current.push({ peerID: userID, peer });
            peersArr.push({ peerID: userID, peer });
          });
          setPeers(peersArr);
        });

        // 3. Handle a new user joining
        socket.on("user-joined", (payload) => {
          const exists = peersRef.current.find(p => p.peerID === payload.callerID);
          if (!exists) {
            const peer = addPeer(payload.signal, payload.callerID, currentStream);
            peersRef.current.push({ peerID: payload.callerID, peer });
            setPeers((prev) => [...prev, { peerID: payload.callerID, peer }]);
          }
        });

        // 4. Join the room after listeners are registered
        socket.emit("join-room", { roomID, username });

        // 5. Complete the handshake
        socket.on("receiving-returned-signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          if (item) item.peer.signal(payload.signal);
        });

        // 6. Handle user leaving (The Error-Fixing Block)
        socket.on("user-left", (id) => {
          console.log("Cleaning up peer who left:", id);
          const peerObj = peersRef.current.find(p => p.peerID === id);
          
          if (peerObj && peerObj.peer) {
            try {
              // Destroy the peer connection safely
              peerObj.peer.destroy();
            } catch (err) {
              console.warn("Peer already destroyed or closing...");
            }
          }

          // Update local state to remove their video grid
          const filteredPeers = peersRef.current.filter(p => p.peerID !== id);
          peersRef.current = filteredPeers;
          setPeers([...filteredPeers]);
        });
      })
      .catch(err => console.error("Media access error:", err));

    return () => {
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("receiving-returned-signal");
      socket.off("user-left");
    };
  }, [isAuth, roomID, username]);

  // --- MESH HELPER FUNCTIONS ---

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });

    // SILENCE internal _readableState errors
    peer.on("error", (err) => {
      if (err.message.includes('_readableState')) return;
      console.error("Peer Error:", err);
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerID });
    });

    // SILENCE internal _readableState errors
    peer.on("error", (err) => {
      if (err.message.includes('_readableState')) return;
      console.error("Peer Error:", err);
    });

    peer.signal(incomingSignal);
    return peer;
  }

  // --- DEVICE CONTROLS ---

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !micActive;
      setMicActive(!micActive);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !cameraActive;
      setCameraActive(!cameraActive);
    }
  };

  const shareScreen = () => {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((screenStream) => {
      const screenTrack = screenStream.getTracks()[0];
      
      // Replace video track for all connected peers
      peersRef.current.forEach(({ peer }) => {
        peer.replaceTrack(
          stream.getVideoTracks()[0], 
          screenTrack, 
          stream
        );
      });

      // Update local preview
      userVideo.current.srcObject = screenStream;

      // Handle when user clicks "Stop Sharing" in browser UI
      screenTrack.onended = () => {
        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(
            screenTrack, 
            stream.getVideoTracks()[0], 
            stream
          );
        });
        userVideo.current.srcObject = stream;
      };
    });
  };

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    socket.disconnect();
    window.location.reload(); 
  };

  // --- RENDERING ---

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
        <div className="text-xs text-slate-500 font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800 uppercase">
          ROOM: {roomID}
        </div>
      </nav>

      <main className="flex-1 relative p-6 grid grid-cols-12 gap-6 overflow-y-auto pb-32">
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
          <VideoGrid 
            userVideo={userVideo} 
            peers={peers} 
            username={username} 
          />
          <Whiteboard socket={socket} roomId={roomID} />
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