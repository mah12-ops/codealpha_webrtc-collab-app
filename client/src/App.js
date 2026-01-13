import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import Auth from "./components/Auth";
import VideoGrid from "./components/VideoGrid";
import Whiteboard from "./components/Whiteboard";

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

  // WebRTC Logic (initiateCall, prepareToReceiveCall, shareScreen go here...)
  // ... (use the logic from previous responses)

  if (!isAuth) return <Auth setUsername={setUsername} setIsAuth={setIsAuth} />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
        <header className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-black italic text-indigo-500">NEXUS.</h1>
            <button onClick={/* shareScreen function */} className="bg-indigo-600 px-6 py-2 rounded-full hover:bg-indigo-500 transition">Share Screen</button>
        </header>

        <main className="flex flex-col items-center">
            <VideoGrid userVideo={userVideo} partnerVideo={partnerVideo} username={username} />
            <div className="w-full max-w-5xl">
                <Whiteboard socket={socket} />
            </div>
        </main>
    </div>
  );
}

export default App;