import React from "react";

const VideoGrid = ({ userVideo, partnerVideo, username, micActive, cameraActive }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 aspect-video shadow-2xl">
      {!cameraActive && <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-bold">Camera Off</div>}
      <video playsInline muted ref={userVideo} autoPlay className={`w-full h-full object-cover ${!cameraActive && 'hidden'}`} />
      <div className="absolute bottom-4 left-4 flex gap-2 items-center">
        <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold">{username} (You)</span>
        {!micActive && <span className="bg-red-500 px-2 py-1 rounded-lg text-[10px]">MUTED</span>}
      </div>
    </div>
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 aspect-video shadow-2xl">
      <video playsInline ref={partnerVideo} autoPlay className="w-full h-full object-cover" />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold">Remote Partner</div>
    </div>
  </div>
);

export default VideoGrid;