import React from "react";

const VideoGrid = ({ userVideo, partnerVideo, username }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
    <div className="relative group">
      <video playsInline muted ref={userVideo} autoPlay className="w-full rounded-2xl bg-black aspect-video object-cover border-2 border-indigo-500 shadow-lg" />
      <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs">You ({username})</span>
    </div>
    <div className="relative group">
      <video playsInline ref={partnerVideo} autoPlay className="w-full rounded-2xl bg-black aspect-video object-cover border-2 border-slate-700 shadow-lg" />
      <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs">Partner</span>
    </div>
  </div>
);

export default VideoGrid;