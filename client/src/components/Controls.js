import React from "react";

const Controls = ({ micActive, cameraActive, toggleMic, toggleCamera, shareScreen, endCall }) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#1e232e]/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-700 shadow-2xl z-50">
      <button 
        onClick={toggleMic} 
        className={`p-4 rounded-2xl transition-all ${micActive ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600 text-white'}`}
      >
        {micActive ? "🎤" : "🔇"}
      </button>
      
      <button 
        onClick={toggleCamera} 
        className={`p-4 rounded-2xl transition-all ${cameraActive ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600 text-white'}`}
      >
        {cameraActive ? "📹" : "🚫"}
      </button>

      <div className="w-[1px] h-8 bg-slate-700 mx-2" />

      <button onClick={shareScreen} className="p-4 bg-slate-700 hover:bg-indigo-600 rounded-2xl transition-all" title="Share Screen">
        🖥️
      </button>

      <button onClick={endCall} className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all px-8 font-bold text-sm uppercase tracking-widest">
        End Call
      </button>
    </div>
  );
};

export default Controls;