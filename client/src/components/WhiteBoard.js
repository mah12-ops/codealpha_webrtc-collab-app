import React, { useEffect, useRef } from "react";

const Whiteboard = ({ socket, roomId }) => {
  const canvasRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 1. DATABASE LOAD: Receive existing drawing
    socket.on("load-whiteboard", (dataURL) => {
      console.log("Loading whiteboard from DB...");
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Wipe before loading
      if (dataURL && dataURL !== "") {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = dataURL;
      }
    });

    // 2. REMOTE DRAWING: Receive live strokes
    socket.on("drawing", (data) => {
      // If a partner sends an empty canvas state, clear my board
      if (data.fullCanvasState === "") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (data.x !== undefined && data.y !== undefined) {
        drawRemote(data.x, data.y, data.isNewPath);
      }
    });

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      
      // Save current drawing before resize wipes it
      const tempImage = canvas.toDataURL();
      canvas.width = container.offsetWidth;
      canvas.height = 400;
      
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = tempImage;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      socket.off("load-whiteboard");
      socket.off("drawing");
    };
  }, [socket, roomId]); // Added roomId dependency

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
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
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
    
    socket.emit("drawing", { 
      roomID: roomId,
      x: offsetX, 
      y: offsetY, 
      isNewPath: false,
      fullCanvasState: canvas.toDataURL() 
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Broadcast clear event to others and save empty state to MariaDB
    socket.emit("drawing", { 
        roomID: roomId, 
        fullCanvasState: "",
        clear: true 
    });
  };

  return (
    <div ref={containerRef} className="bg-[#1e293b] rounded-3xl p-6 border border-slate-800 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-lg">🎨</div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Live Collaboration</h3>
        </div>
        <button 
          onClick={clearCanvas} 
          className="text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl border border-red-500/20 transition-all"
        >
          Clear Board
        </button>
      </div>

      <canvas 
        ref={canvasRef} 
        onMouseDown={startDrawing}
        onMouseMove={draw}
        className="w-full h-[400px] bg-white rounded-2xl cursor-crosshair shadow-inner ring-4 ring-slate-800/10"
      />
    </div>
  );
};

export default Whiteboard;