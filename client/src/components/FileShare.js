import React from "react";

const FileShare = ({ peer }) => {
  const sendFile = (e) => {
    const file = e.target.files[0];
    if (!file || !peer) return;

    // Convert file to ArrayBuffer and send via WebRTC Data Channel
    file.arrayBuffer().then((buffer) => {
      peer.send(buffer);
      alert(`File "${file.name}" sent!`);
    });
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 h-full">
      <h3 className="text-lg font-semibold mb-4 text-white">P2P File Transfer</h3>
      <div className="relative group border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-indigo-500 transition bg-slate-800/30">
        <input
          type="file"
          onChange={sendFile}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-2">
          <p className="text-sm text-slate-400">Click to upload file</p>
          <p className="text-xs text-slate-500 italic">Direct Peer-to-Peer Transfer</p>
        </div>
      </div>
    </div>
  );
};

export default FileShare;