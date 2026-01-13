import React, { useState } from "react";

const Auth = ({ setUsername, setIsAuth }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setUsername(input);
      setIsAuth(true);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-md p-8 bg-[#1e293b] rounded-3xl shadow-2xl border border-slate-800">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-indigo-500/10 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-slate-400 mt-2">Enter your name to start the session</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            placeholder="Your Name"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02]">
            Join Meeting
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;