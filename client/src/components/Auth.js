import React, { useState } from "react";

const Auth = ({ setUsername, setRoomID, setIsAuth }) => {
  const [nameInput, setNameInput] = useState("");
  const [roomInput, setRoomInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nameInput.trim() && roomInput.trim()) {
      setUsername(nameInput);
      setRoomID(roomInput); // Set the room to join in MariaDB
      setIsAuth(true);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#0b0e14]">
      <div className="w-full max-w-md p-10 bg-[#161b22] rounded-[2rem] shadow-2xl border border-slate-800/50">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-indigo-500/10 rounded-3xl mb-4 border border-indigo-500/20">
            <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">NEXUS COLLAB</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Connect with your team instantly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block tracking-widest">Display Name</label>
            <input
              autoFocus
              className="w-full p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
              placeholder="e.g. John Doe"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block tracking-widest">Room Name</label>
            <input
              className="w-full p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
              placeholder="e.g. design-team"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
            />
          </div>

          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            Enter Meeting
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;