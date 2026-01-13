import React, { useEffect, useRef } from "react";

const VideoGrid = ({ userVideo, peers, username }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {/* Local Video (You) */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-indigo-500 shadow-2xl aspect-video group">
        <video
          playsInline
          muted
          ref={userVideo}
          autoPlay
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10">
          {username} (You)
        </div>
        {/* Animated "Recording/Live" dot */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Remote Peer Videos */}
      {peers.map((peerObj, index) => (
        <PeerVideo key={peerObj.peerID} peer={peerObj.peer} />
      ))}
    </div>
  );
};

// Sub-component for individual Peer streams
const PeerVideo = ({ peer }) => {
  const videoRef = useRef();

  useEffect(() => {
    // Listen for the 'stream' event from the simple-peer instance
    peer.on("stream", (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl aspect-video transition-transform hover:scale-[1.01]">
      <video
        playsInline
        ref={videoRef}
        autoPlay
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10">
        Remote Partner
      </div>
    </div>
  );
};

export default VideoGrid;