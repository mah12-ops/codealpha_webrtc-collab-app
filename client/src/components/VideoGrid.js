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
    // 1. Helper function to attach the stream to the video element
    const attachStream = (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    // 2. CHECK: If the peer already has a stream attached (fixes the black screen in Tab 1)
    if (peer.streams && peer.streams[0]) {
      console.log("Stream already exists, attaching now...");
      attachStream(peer.streams[0]);
    }

    // 3. LISTEN: For the stream event if it hasn't happened yet
    peer.on("stream", (stream) => {
      console.log("New remote stream received!");
      attachStream(stream);
    });

    // Cleanup listeners when component unmounts
    return () => {
      peer.off("stream");
    };
  }, [peer]);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl aspect-video transition-all hover:scale-[1.01] hover:border-slate-700">
      <video
        playsInline
        autoPlay
        ref={videoRef}
        // Use 'muted' if you have audio feedback/screeching during testing.
        // Browsers allow auto-play more easily if muted is true.
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10 text-white">
        Remote Partner
      </div>
      
      {/* Small UI indicator to show connection is active */}
      <div className="absolute top-4 right-4 bg-indigo-500/20 px-2 py-1 rounded-md border border-indigo-500/30">
         <span className="text-[9px] text-indigo-400 font-bold uppercase">Connected</span>
      </div>
    </div>
  );
};

export default VideoGrid; 