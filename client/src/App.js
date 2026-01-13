import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io.connect("http://localhost:5000");

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState("");
  const [stream, setStream] = useState(null);
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();
  const canvasRef = useRef();

  // Authentication Handler
  const handleLogin = (e) => {
    e.preventDefault();
    if (username.length > 2) setIsAuth(true);
  };

  useEffect(() => {
    if (isAuth) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
        setStream(s);
        if (userVideo.current) userVideo.current.srcObject = s;
      });
      socket.emit("join-room", "main-room");
    }
    
    socket.on("other-user", (userId) => initiateCall(userId));
    socket.on("user-joined", (userId) => prepareToReceiveCall(userId));
    socket.on("offer", (data) => peerRef.current?.signal(data.signal));
    socket.on("answer", (data) => peerRef.current?.signal(data.signal));
    socket.on("drawing", (data) => draw(data.x, data.y, false));
  }, [isAuth]);

  // WebRTC & Features Logic
  function initiateCall(targetId) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => socket.emit("offer", { target: targetId, signal }));
    peer.on("stream", (s) => (partnerVideo.current.srcObject = s));
    peerRef.current = peer;
  }

  function prepareToReceiveCall(callerId) {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => socket.emit("answer", { target: callerId, signal }));
    peer.on("stream", (s) => (partnerVideo.current.srcObject = s));
    peerRef.current = peer;
  }

  const shareScreen = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
    const screenTrack = screenStream.getTracks()[0];
    peerRef.current.replaceTrack(stream.getVideoTracks()[0], screenTrack, stream);
    userVideo.current.srcObject = screenStream;
    screenTrack.onended = () => {
      peerRef.current.replaceTrack(screenTrack, stream.getVideoTracks()[0], stream);
      userVideo.current.srcObject = stream;
    };
  };

  const draw = (x, y, emit) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#6366f1";
    ctx.lineTo(x, y); ctx.stroke();
    if (emit) socket.emit("drawing", { x, y });
  };

  if (!isAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
        <form onSubmit={handleLogin} className="w-96 p-8 bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-center">Join Workspace</h2>
          <input 
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 focus:outline-none focus:border-indigo-500 mb-4"
            placeholder="Enter Name..." value={username} onChange={(e) => setUsername(e.target.value)}
          />
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-semibold transition">Start Collaborating</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">NEXUS COLLAB 2025</h1>
        <div className="flex gap-3">
          <button onClick={shareScreen} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-sm transition">Share Screen</button>
          <button className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20 text-sm transition">End Call</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Video Section */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <video playsInline muted ref={userVideo} autoPlay className="w-full rounded-2xl bg-black aspect-video object-cover border-2 border-indigo-500/50 shadow-indigo-500/10 shadow-lg" />
              <span className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-md text-xs font-medium">You ({username})</span>
            </div>
            <div className="relative group">
              <video playsInline ref={partnerVideo} autoPlay className="w-full rounded-2xl bg-black aspect-video object-cover border-2 border-slate-700 shadow-lg" />
              <span className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-md text-xs font-medium">Partner</span>
            </div>
          </div>

          {/* Whiteboard */}
          <div className="bg-[#1e293b] rounded-2xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" /> Live Whiteboard
            </div>
            <canvas 
              ref={canvasRef} width={800} height={400} 
              onMouseDown={(e) => {
                const ctx = canvasRef.current.getContext("2d");
                ctx.beginPath(); ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
              }}
              onMouseMove={(e) => e.buttons === 1 && draw(e.nativeEvent.offsetX, e.nativeEvent.offsetY, true)}
              className="w-full h-[300px] bg-white rounded-xl cursor-crosshair"
            />
          </div>
        </div>

        {/* Sidebar Features */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 h-full">
            <h3 className="text-lg font-semibold mb-4">File Sharing</h3>
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-indigo-500 transition cursor-pointer bg-slate-800/50">
              <p className="text-sm text-slate-400">Drag & drop or click to upload</p>
              <input type="file" className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="mt-4 inline-block bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">Choose File</label>
            </div>
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Encryption Status</h4>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                AES-256 P2P Encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;