import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import Auth from "./components/Auth";
import VideoGrid from "./components/VideoGrid";
import Whiteboard from "./components/WhiteBoard";
import FileShare from "./components/FileShare";
import Controls from "./components/Controls";

const socket = io.connect("http://localhost:5000");

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState("");
  const [roomID, setRoomID] = useState("");
  const [stream, setStream] = useState(null);
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [peers, setPeers] = useState([]); 
  
  const userVideo = useRef();
  const peersRef = useRef([]); 

  useEffect(() => {
    if (!isAuth || !roomID) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (userVideo.current) userVideo.current.srcObject = currentStream;

      socket.emit("join-room", { roomID, username });

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

      socket.on("user-joined", (payload) => {
        const item = peersRef.current.find(p => p.peerID === payload.callerID);
        if (!item) {
          const peer = addPeer(payload.signal, payload.callerID, currentStream);
          peersRef.current.push({ peerID: payload.callerID, peer });
          setPeers((prev) => [...prev, { peerID: payload.callerID, peer }]);
        }
      });

      socket.on("receiving-returned-signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        if (item) item.peer.signal(payload.signal);
      });

      socket.on("user-left", (id) => {
        handlePeerDisconnect(id);
      });
    });

    return () => {
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("receiving-returned-signal");
      socket.off("user-left");
    };
  }, [isAuth, roomID, username]);

  // --- CLEAN DISCONNECT LOGIC ---
 const handlePeerDisconnect = (id) => {
    console.log("Cleaning up peer:", id);
    
    const peerObj = peersRef.current.find(p => p.peerID === id);
    
    // 1. Update UI immediately
    setPeers((prev) => prev.filter(p => p.peerID !== id));

    if (peerObj && peerObj.peer) {
      try {
        // Stop all tracks associated with this peer specifically
        if (peerObj.peer.streams) {
          peerObj.peer.streams.forEach(s => s.getTracks().forEach(t => t.stop()));
        }
        
        // Remove listeners so it stops trying to "read" data
        peerObj.peer.removeAllListeners('stream');
        peerObj.peer.removeAllListeners('data');
        peerObj.peer.removeAllListeners('signal');
        
        // Instead of destroy(), just let it sit or use a safe destroy
        if (!peerObj.peer.destroyed) {
            peerObj.peer.destroy();
        }
      } catch (e) {
        console.log("Safe cleanup performed");
      }
    }

    peersRef.current = peersRef.current.filter(p => p.peerID !== id);
  };

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    // CRITICAL: Prevent the _readableState crash
    // We overwrite the internal error handler to catch the stream-state error
    peer.on("error", (err) => {
      if (err.message.includes('_readableState')) return; // Ignore this specific error
      console.error("Peer error:", err);
    });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });

    // CRITICAL: Prevent the _readableState crash
    peer.on("error", (err) => {
      if (err.message.includes('_readableState')) return;
      console.error("Peer error:", err);
    });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerID });
    });

    peer.signal(incomingSignal);
    return peer;
  }

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    socket.disconnect();
    window.location.reload(); 
  };

  // Rest of your device control functions (toggleMic, etc.) stay the same...
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

  if (!isAuth) return <Auth setUsername={setUsername} setRoomID={setRoomID} setIsAuth={setIsAuth} />;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 flex flex-col">
      <nav className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0b0e14]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">N</div>
          <span className="font-bold tracking-tight">NEXUS <span className="text-indigo-500 text-xs font-black">PRO</span></span>
        </div>
        <div className="text-xs text-slate-500 font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800 uppercase">
          Room: {roomID}
        </div>
      </nav>

      <main className="flex-1 relative p-6 grid grid-cols-12 gap-6 overflow-y-auto pb-32">
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
          <VideoGrid userVideo={userVideo} peers={peers} username={username} />
          <Whiteboard socket={socket} roomId={roomID} />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <FileShare peers={peers} />
        </div>
      </main>

      <Controls micActive={micActive} cameraActive={cameraActive} toggleMic={toggleMic} toggleCamera={toggleCamera} shareScreen={shareScreen} endCall={endCall} />
    </div>
  );
}

export default App;