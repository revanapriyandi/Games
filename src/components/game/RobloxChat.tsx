import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage } from "../../lib/game/actions";
import type { ChatMessage } from "../../lib/types";

interface RobloxChatProps {
    roomId: string;
    playerId: string;
    chatMessages?: Record<string, ChatMessage>;
}

export function RobloxChat({ roomId, playerId, chatMessages }: RobloxChatProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [message, setMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Convert record to array and sort by timestamp
    const messages = Object.entries(chatMessages || {})
        .map(([id, msg]) => ({ ...msg, id }))
        .sort((a, b) => a.timestamp - b.timestamp);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length, isOpen]);

    const handleSend = () => {
        if (!message.trim()) return;
        sendChatMessage(roomId, playerId, message);
        setMessage("");
    };

    return (
        <div className="fixed top-2 right-2 z-50 flex flex-col items-end pointer-events-none font-sans">
             {/* Toggle Button - always clickable */}
            <div className="pointer-events-auto mb-2 mr-1">
                 <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-sm transition-colors border border-white/10 shadow-lg"
                    title={isOpen ? "Tutup Chat" : "Buka Chat"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-black/80 backdrop-blur-md w-[240px] md:w-[260px] h-[350px] md:h-[400px] rounded-xl border border-white/10 flex flex-col overflow-hidden pointer-events-auto shadow-2xl"
                    >
                        {/* Header */}
                        <div className="bg-white/5 px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-white/70 border-b border-white/10 flex justify-between items-center">
                            <span>Chat Log</span>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                        >
                            {messages.length === 0 && (
                                <div className="text-white/30 text-[10px] text-center mt-10 italic">
                                    Belum ada pesan...
                                </div>
                            )}
                            {messages.map((msg) => {
                                const isMe = msg.senderId === playerId;
                                const isSystem = msg.senderId === "SYSTEM";
                                return (
                                    <div key={msg.id} className={`text-[11px] leading-tight ${isSystem ? "opacity-90 py-1 bg-white/5 px-1.5 rounded" : ""}`}>
                                        <span className={`font-bold ${isSystem ? "text-transparent" : isMe ? "text-yellow-400" : "text-blue-400"}`}>
                                            {isSystem ? "" : `[${msg.senderName.slice(0, 8)}]:`}
                                        </span>{" "}
                                        <span className={`${isSystem ? "text-yellow-100 italic" : "text-white"} drop-shadow-sm break-words`}>
                                            {isSystem && <span className="mr-1">🎲</span>}
                                            {msg.message}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input */}
                        <div className="p-2 bg-black/40 border-t border-white/10">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Klik untuk chat..."
                                className="w-full bg-white/10 text-white text-xs px-3 py-2.5 rounded-lg border border-white/10 focus:border-white/40 outline-none placeholder:text-white/40 transition-all focus:bg-white/20"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
