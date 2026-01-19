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
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10 text-white">
          {username} (You)
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">Live</span>
        </div>
      </div>

      {/* Remote Peer Videos */}
      {peers.map((peerObj) => (
        <PeerVideo key={peerObj.peerID} peer={peerObj.peer} />
      ))}
    </div>
  );
};

// Sub-component for individual Peer streams
const PeerVideo = ({ peer }) => {
  const videoRef = useRef();

  useEffect(() => {
    // 1. Define a named function for the listener
    const handleStream = (stream) => {
      console.log("Remote stream received and attached.");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    // 2. Check if the peer already has a stream attached 
    // (This fixes the black screen for the person who was already in the room)
    if (peer.streams && peer.streams[0]) {
      handleStream(peer.streams[0]);
    }

    // 3. Attach the named listener for the 'stream' event
    peer.on("stream", handleStream);

    // 4. CLEANUP: Properly remove the listener using the function reference
    return () => {
      // removeListener is the safe version of .off() for simple-peer
      peer.removeListener("stream", handleStream);
    };
  }, [peer]);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl aspect-video transition-all hover:scale-[1.01] hover:border-slate-700">
      <video
        playsInline
        autoPlay
        ref={videoRef}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10 text-white">
        Remote Partner
      </div>
      
      <div className="absolute top-4 right-4 bg-indigo-500/20 px-2 py-1 rounded-md border border-indigo-500/30">
         <span className="text-[9px] text-indigo-400 font-bold uppercase">Connected</span>
      </div>
    </div>
  );
};

export default VideoGrid;