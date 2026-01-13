import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import Auth from "./components/Auth";
import VideoGrid from "./components/VideoGrid";
import Whiteboard from "./components/Whiteboard";
import FileShare from "./components/FileShare";
import Controls from "./components/Controls"; // New Component

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

  useEffect(() => {
    if (!isAuth) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
      setStream(s);
      if (userVideo.current) userVideo.current.srcObject = s;
    });
    socket.emit("join-room", "main-room");
    socket.on("other-user", (userId) => initiateCall(userId));
    socket.on("user-joined", (userId) => prepareToReceiveCall(userId));
    socket.on("offer", (data) => peerRef.current?.signal(data.signal));
    socket.on("answer", (data) => peerRef.current?.signal(data.signal));
  }, [isAuth]);

  // Feature: Mute/Unmute
  const toggleMic = () => {
    stream.getAudioTracks()[0].enabled = !micActive;
    setMicActive(!micActive);
  };

  // Feature: Video On/Off
  const toggleCamera = () => {
    stream.getVideoTracks()[0].enabled = !cameraActive;
    setCameraActive(!cameraActive);
  };

  // Feature: End Call
  const endCall = () => {
    window.location.reload(); // Simplest way to reset all Peer/Socket connections
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

  if (!isAuth) return <Auth setUsername={setUsername} setIsAuth={setIsAuth} />;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 overflow-hidden flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0b0e14]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">N</div>
          <span className="font-bold tracking-tight">NEXUS <span className="text-indigo-500 text-xs">PRO</span></span>
        </div>
        <div className="text-sm font-medium text-slate-400">Room: <span className="text-indigo-400">Main-Workspace</span></div>
      </nav>

      <main className="flex-1 relative p-6 grid grid-cols-12 gap-6 overflow-y-auto">
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

        <div className="col-span-12 lg:col-span-3 space-y-6">
          <FileShare peer={peerRef.current} />
          <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
            <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Pro Tip</p>
            <p className="text-sm text-slate-300">Whiteboard drawings are visible to everyone in real-time.</p>
          </div>
        </div>
      </main>

      {/* Floating Control Bar */}
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