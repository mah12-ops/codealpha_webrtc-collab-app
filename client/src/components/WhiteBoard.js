import React, { useEffect, useRef } from "react";

const Whiteboard = ({ socket }) => {
  const canvasRef = useRef();

  useEffect(() => {
    socket.on("drawing", (data) => draw(data.x, data.y, false));
  }, [socket]);

  const draw = (x, y, emit) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#6366f1";
    ctx.lineTo(x, y); ctx.stroke();
    if (emit) socket.emit("drawing", { x, y });
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4 border border-slate-700 mt-6">
      <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase">Collaborative Canvas</h3>
      <canvas 
        ref={canvasRef} width={800} height={400} 
        onMouseDown={(e) => {
          canvasRef.current.getContext("2d").beginPath();
          canvasRef.current.getContext("2d").moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        }}
        onMouseMove={(e) => e.buttons === 1 && draw(e.nativeEvent.offsetX, e.nativeEvent.offsetY, true)}
        className="w-full h-[300px] bg-white rounded-xl cursor-crosshair"
      />
    </div>
  );
};

export default Whiteboard;