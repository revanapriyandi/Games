import { useState, useEffect } from "react";
import { startAmbientMusic, stopAmbientMusic, toggleMute, getMuteState } from "../lib/sounds";
import { motion } from "framer-motion";

export function BackgroundMusic() {
  const [isMuted, setIsMuted] = useState(getMuteState());
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Attempt to start music on first user interaction (browser policy)
    const handleInteraction = () => {
      if (!hasStarted) {
        startAmbientMusic();
        setHasStarted(true);
      }
    };

    window.addEventListener("click", handleInteraction);
    return () => {
        window.removeEventListener("click", handleInteraction);
        stopAmbientMusic();
    };
  }, [hasStarted]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other clicks
    const newState = toggleMute();
    setIsMuted(newState);
    
    // If manually toggling, ensure music is running
    if (!hasStarted && !newState) {
        startAmbientMusic();
        setHasStarted(true);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={handleToggle}
      className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-600 shadow-xl hover:bg-slate-700 transition-colors group"
      title={isMuted ? "Unmute Music" : "Mute Music"}
    >
      {isMuted ? (
        <span className="text-xl">🔇</span>
      ) : (
        <span className="text-xl flex items-center justify-center">
            🎵
            <span className="absolute -top-1 -right-1 block w-2 h-2 bg-green-500 rounded-full animate-ping" />
        </span>
      )}
    </motion.button>
  );
}
