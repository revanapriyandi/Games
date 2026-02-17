import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceControlProps {
    isJoined: boolean;
    isMuted: boolean;
    toggleVoice: () => void;
    toggleMute: () => void;
}

export function VoiceControl({ isJoined, isMuted, toggleVoice, toggleMute }: VoiceControlProps) {
    return (
        <div className="fixed left-2 top-14 flex flex-col gap-2 z-50">
            {/* Join/Leave Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleVoice}
                className={`p-2 rounded-full shadow-lg border-2 transition-colors ${
                    isJoined
                        ? "bg-red-500/80 border-red-400 hover:bg-red-600 text-white"
                        : "bg-emerald-500/80 border-emerald-400 hover:bg-emerald-600 text-white"
                }`}
                title={isJoined ? "Disconnect Voice" : "Join Voice"}
            >
                {isJoined ? <PhoneOff size={18} /> : <Phone size={18} />}
            </motion.button>

            {/* Mute/Unmute Button (Only visible when joined) */}
            {isJoined && (
                <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMute}
                    className={`p-2 rounded-full shadow-lg border-2 transition-colors ${
                        isMuted
                            ? "bg-gray-600/80 border-gray-500 hover:bg-gray-700 text-white"
                            : "bg-blue-500/80 border-blue-400 hover:bg-blue-600 text-white"
                    }`}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </motion.button>
            )}
        </div>
    );
}
