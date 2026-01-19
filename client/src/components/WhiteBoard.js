import React, { useEffect, useRef } from "react";

const Whiteboard = ({ socket, roomId }) => {
  const canvasRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 1. DATABASE LOAD: Receive existing drawing from MariaDB
    
socket.on("load-whiteboard", (dataURL) => {
  if (!dataURL) {
    // If the DB sent an empty string, clear the board
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear old pixels first
    ctx.drawImage(img, 0, 0);
  };
  img.src = dataURL;
});

    // 2. REMOTE DRAWING: Receive live strokes from partners
    socket.on("drawing", (data) => {
      drawRemote(data.x, data.y, data.isNewPath);
    });

    const resizeCanvas = () => {
      const container = containerRef.current;
      const tempImage = canvas.toDataURL();
      canvas.width = container.offsetWidth;
      canvas.height = 400;
      const img = new Image();
      img.src = tempImage;
      img.onload = () => ctx.drawImage(img, 0, 0);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      socket.off("load-whiteboard");
      socket.off("drawing");
    };
  }, [socket]);

  const drawRemote = (x, y, isNewPath) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#6366f1";
    if (isNewPath) ctx.beginPath();
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const startDrawing = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    const { offsetX, offsetY } = e.nativeEvent;
    ctx.moveTo(offsetX, offsetY);
    
    socket.emit("drawing", { 
      roomID: roomId, 
      x: offsetX, 
      y: offsetY, 
      isNewPath: true 
    });
  };

  const draw = (e) => {
    if (e.buttons !== 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { offsetX, offsetY } = e.nativeEvent;
    
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#6366f1";
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    
    // Send stroke AND the full state for DB saving
    socket.emit("drawing", { 
      roomID: roomId,
      x: offsetX, 
      y: offsetY, 
      isNewPath: false,
      fullCanvasState: canvas.toDataURL() // This goes to MariaDB
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Optional: Tell server to clear DB record too
    socket.emit("drawing", { roomID: roomId, fullCanvasState: "" });
  };

  return (
    <div ref={containerRef} className="bg-[#1e293b] rounded-3xl p-6 border border-slate-800 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">🎨</div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Live Collaboration</h3>
        </div>
        <button onClick={clearCanvas} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded-md border border-slate-700">
          Clear Board
        </button>
      </div>

      <canvas 
        ref={canvasRef} 
        onMouseDown={startDrawing}
        onMouseMove={draw}
        className="w-full h-[400px] bg-white rounded-2xl cursor-crosshair shadow-inner ring-4 ring-slate-800/50"
      />
    </div>
  );
};

export default Whiteboard;