const PeerVideo = ({ peer }) => {
  const videoRef = useRef();

  useEffect(() => {
    const handleStream = (stream) => {
      // THE FIX: Always check if videoRef.current is still there
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    if (peer.streams && peer.streams[0]) {
      handleStream(peer.streams[0]);
    }

    peer.on("stream", handleStream);

    // Add a check for the 'close' event to clean up the video element
    peer.on("close", () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    });

    return () => {
      peer.removeListener("stream", handleStream);
      peer.removeAllListeners("close");
    };
  }, [peer]);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl aspect-video transition-all hover:scale-[1.01] hover:border-slate-700">
      <video
        playsInline
        autoPlay
        ref={videoRef}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10 text-white">
        Remote Partner
      </div>
    </div>
  );
};