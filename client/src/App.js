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
  const [stream, setStream] = useState(null);
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();

  // --- 1. Define Functions FIRST to avoid ESLint Errors ---

  const initiateCall = (targetId, currentStream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });
    peer.on("signal", (signal) => socket.emit("offer", { target: targetId, signal }));
    peer.on("stream", (s) => { if (partnerVideo.current) partnerVideo.current.srcObject = s; });
    peerRef.current = peer;
  };

  const prepareToReceiveCall = (callerId, currentStream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });
    peer.on("signal", (signal) => socket.emit("answer", { target: callerId, signal }));
    peer.on("stream", (s) => { if (partnerVideo.current) partnerVideo.current.srcObject = s; });
    peerRef.current = peer;
  };

  // --- 2. The UseEffect Hook ---

  useEffect(() => {
    if (!isAuth) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
      setStream(s);
      if (userVideo.current) userVideo.current.srcObject = s;

      // Join room ONLY after camera is ready
      socket.emit("join-room", "main-room");

      socket.on("other-user", (userId) => initiateCall(userId, s));
      socket.on("user-joined", (userId) => prepareToReceiveCall(userId, s));
    });

    socket.on("offer", (data) => peerRef.current?.signal(data.signal));
    socket.on("answer", (data) => peerRef.current?.signal(data.signal));

    return () => socket.off(); // Cleanup
  }, [isAuth]);

  // --- 3. Feature Logic ---

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
      peerRef.current.replaceTrack(stream.getVideoTracks()[0], screenTrack, stream);
      userVideo.current.srcObject = screenStream;
      screenTrack.onended = () => {
        peerRef.current.replaceTrack(screenTrack, stream.getVideoTracks()[0], stream);
        userVideo.current.srcObject = stream;
      };
    });
  };

  const endCall = () => window.location.reload();

  if (!isAuth) return <Auth setUsername={setUsername} setIsAuth={setIsAuth} />;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 flex flex-col">
      <nav className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0b0e14]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">N</div>
          <span className="font-bold tracking-tight">NEXUS <span className="text-indigo-500 text-xs font-black">PRO</span></span>
        </div>
      </nav>

      <main className="flex-1 relative p-6 grid grid-cols-12 gap-6 overflow-y-auto pb-32">
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
          <VideoGrid 
            userVideo={userVideo} 
            partnerVideo={partnerVideo} 
            username={username} 
            micActive={micActive} 
            cameraActive={cameraActive} 
          />
          <Whiteboard socket={socket} />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <FileShare peer={peerRef.current} />
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