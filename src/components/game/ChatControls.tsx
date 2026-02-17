import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage } from "../../lib/game/actions";

interface ChatControlsProps {
    roomId: string;
    playerId: string;
}

const EMOJIS = ["😀", "😂", "😎", "🤔", "😭", "😡", "👍", "👎", "🔥", "❤️", "🎉", "👻"];

export function ChatControls({ roomId, playerId }: ChatControlsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (!message.trim()) return;
        sendChatMessage(roomId, playerId, message);
        setMessage("");
        setIsOpen(false);
    };

    return (
        <div className="fixed left-2 bottom-20 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 bg-blue-600/80 hover:bg-blue-500/80 text-white rounded-full border border-blue-400/30 shadow-lg backdrop-blur-sm flex items-center justify-center transition-all"
            >
                💬
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute bottom-12 left-0 bg-slate-900/95 border border-blue-500/30 rounded-xl p-3 shadow-2xl backdrop-blur-md w-[260px]"
                    >
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Ketik pesan..."
                                className="flex-1 bg-slate-800 text-white text-xs px-2 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500"
                                autoFocus
                            />
                            <button
                                onClick={handleSend}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-lg font-bold"
                            >
                                Kirim
                            </button>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                            {EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => {
                                        sendChatMessage(roomId, playerId, emoji);
                                        setIsOpen(false);
                                    }}
                                    className="text-xl hover:bg-white/10 p-1 rounded transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
