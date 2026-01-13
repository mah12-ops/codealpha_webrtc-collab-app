import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import Auth from "./components/Auth";
import VideoGrid from "./components/VideoGrid";
import Whiteboard from "./components/WhiteBoard";
import FileShare from "./components/FileShare";

const socket = io.connect("http://localhost:5000");

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState("");
  const [stream, setStream] = useState(null);
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();

  useEffect(() => {
    if (!isAuth) return;

    // Get Media Stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
      setStream(s);
      if (userVideo.current) userVideo.current.srcObject = s;
    });

    socket.emit("join-room", "main-room");

    socket.on("other-user", (userId) => initiateCall(userId));
    socket.on("user-joined", (userId) => prepareToReceiveCall(userId));
    
    socket.on("offer", (data) => {
      peerRef.current?.signal(data.signal);
    });

    socket.on("answer", (data) => {
      peerRef.current?.signal(data.signal);
    });

    // Cleanup on unmount
    return () => socket.disconnect();
  }, [isAuth]);

  // --- WebRTC Logic Functions ---

  function initiateCall(targetId) {
    const peer = new Peer({ initiator: true, trickle: false, stream: stream });
    
    peer.on("signal", (signal) => {
      socket.emit("offer", { target: targetId, signal });
    });

    peer.on("stream", (remoteStream) => {
      if (partnerVideo.current) partnerVideo.current.srcObject = remoteStream;
    });

    peerRef.current = peer;
  }

  function prepareToReceiveCall(callerId) {
    const peer = new Peer({ initiator: false, trickle: false, stream: stream });
    
    peer.on("signal", (signal) => {
      socket.emit("answer", { target: callerId, signal });
    });

    peer.on("stream", (remoteStream) => {
      if (partnerVideo.current) partnerVideo.current.srcObject = remoteStream;
    });

    peerRef.current = peer;
  }

  const shareScreen = () => {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((screenStream) => {
      const screenTrack = screenStream.getTracks()[0];
      
      // Replace video track with screen track
      if (peerRef.current) {
        peerRef.current.replaceTrack(
          stream.getVideoTracks()[0],
          screenTrack,
          stream
        );
      }
      
      userVideo.current.srcObject = screenStream;

      // Handle when user stops sharing screen
      screenTrack.onended = () => {
        peerRef.current.replaceTrack(screenTrack, stream.getVideoTracks()[0], stream);
        userVideo.current.srcObject = stream;
      };
    });
  };

  if (!isAuth) return <Auth setUsername={setUsername} setIsAuth={setIsAuth} />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black italic text-indigo-500">NEXUS.</h1>
        <div className="flex gap-4">
          <button 
            onClick={shareScreen} 
            className="bg-indigo-600 px-6 py-2 rounded-full hover:bg-indigo-500 transition font-medium"
          >
            Share Screen
          </button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* Left Side: Video & Whiteboard */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <VideoGrid userVideo={userVideo} partnerVideo={partnerVideo} username={username} />
          <Whiteboard socket={socket} />
        </div>

        {/* Right Side: File Sharing & Info */}
        <div className="col-span-12 lg:col-span-4">
          <FileShare peer={peerRef.current} />
          
          <div className="mt-6 p-6 bg-[#1e293b] rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Security Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                WebRTC DTLS/SRTP Encrypted
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                Socket.io Signaling Active
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;