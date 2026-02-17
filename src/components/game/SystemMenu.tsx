import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Mic, MicOff, Phone, PhoneOff, MessageSquare, Settings } from "lucide-react";

interface SystemMenuProps {
    roomId: string;
    onLeave: () => void;
    // Voice
    isVoiceJoined: boolean;
    isVoiceMuted: boolean;
    toggleVoice: () => void;
    toggleMute: () => void;
    // Chat
    onToggleChat: () => void;
    isChatOpen: boolean;
    themeName?: string;
}

export function SystemMenu({
    roomId,
    onLeave,
    isVoiceJoined,
    isVoiceMuted,
    toggleVoice,
    toggleMute,
    onToggleChat,
    isChatOpen,
    themeName,
}: SystemMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    return (
        <div ref={menuRef} className="fixed top-3 left-3 z-70">
            {/* Icon Bar - Roblox style */}
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-xl border border-white/10 p-1 shadow-2xl">
                {/* Menu toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    title="Menu"
                >
                    <Settings size={18} />
                </button>

                {/* Chat toggle */}
                <button
                    onClick={onToggleChat}
                    className={`p-2 rounded-lg transition-colors ${isChatOpen ? 'bg-blue-500/30 text-blue-300' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    title={isChatOpen ? "Tutup Chat" : "Buka Chat"}
                >
                    <MessageSquare size={18} />
                </button>

                {/* Voice toggle */}
                <button
                    onClick={toggleVoice}
                    className={`p-2 rounded-lg transition-colors ${isVoiceJoined ? 'bg-emerald-500/30 text-emerald-300' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    title={isVoiceJoined ? "Disconnect Voice" : "Join Voice"}
                >
                    {isVoiceJoined ? <Phone size={18} /> : <PhoneOff size={18} />}
                </button>

                {/* Mute toggle (only when voice joined) */}
                {isVoiceJoined && (
                    <button
                        onClick={toggleMute}
                        className={`p-2 rounded-lg transition-colors ${isVoiceMuted ? 'bg-red-500/30 text-red-300' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                        title={isVoiceMuted ? "Unmute" : "Mute"}
                    >
                        {isVoiceMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                )}
            </div>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-black/85 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                    >
                        {/* Room Info */}
                        <div className="px-4 py-3 border-b border-white/10">
                            <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Room ID</div>
                            <div className="text-xs font-mono text-white select-all mb-2">{roomId}</div>

                            {themeName && (
                                <>
                                    <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Theme</div>
                                    <div className="text-xs text-purple-300 font-medium truncate flex items-center gap-1">
                                        <span>✨</span> {themeName}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Voice Status */}
                        <div className="px-4 py-2.5 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/70">Voice Chat</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isVoiceJoined ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                                    {isVoiceJoined ? (isVoiceMuted ? "MUTED" : "CONNECTED") : "OFF"}
                                </span>
                            </div>
                        </div>

                        {/* Leave Button */}
                        <div className="p-2">
                            <button
                                onClick={() => { setIsOpen(false); onLeave(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 transition-colors text-xs font-bold"
                            >
                                <LogOut size={16} />
                                Keluar Game
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
