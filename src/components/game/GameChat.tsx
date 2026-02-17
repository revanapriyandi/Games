import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage } from "../../lib/game/actions";
import type { ChatMessage } from "../../lib/types";

interface GameChatProps {
    roomId: string;
    playerId: string;
    chatMessages?: Record<string, ChatMessage>;
    isOpen: boolean;
    onToggle: () => void;
}

const QUICK_EMOJIS = [
    '😂', '🤣', '😎', '🔥', '💀', '😈', '🎉', '🥳',
    '👀', '💪', '🙏', '❤️', '😭', '🤡', '👑', '⚡',
    '🎯', '🏆', '🐍', '🪜', '🎲', '🗡️', '🛡️', '💎',
];

export function GameChat({ roomId, playerId, chatMessages, isOpen, onToggle }: GameChatProps) {
    const [message, setMessage] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const messages = Object.entries(chatMessages || {})
        .map(([id, msg]) => ({ ...msg, id }))
        .sort((a, b) => a.timestamp - b.timestamp);

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
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none font-sans">
            <div className="max-w-xs md:max-w-sm ml-auto mr-2 pointer-events-auto">
                {/* Collapsible Chat Panel */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="bg-black/85 backdrop-blur-md border border-white/10 border-b-0 rounded-t-xl flex flex-col shadow-2xl">
                                {/* Messages */}
                                <div
                                    ref={scrollRef}
                                    className="h-[250px] md:h-[300px] overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                                >
                                    {messages.length === 0 && (
                                        <div className="text-white/30 text-[10px] text-center mt-16 italic">
                                            Belum ada pesan...
                                        </div>
                                    )}
                                    {messages.map((msg) => {
                                        const isMe = msg.senderId === playerId;
                                        const isSystem = msg.senderId === "SYSTEM";
                                        return (
                                            <div key={msg.id} className={`text-[11px] leading-tight ${isSystem ? "opacity-90 py-1 bg-white/5 px-1.5 rounded" : ""}`}>
                                                <span className={`font-bold ${isSystem ? "text-cyan-400" : isMe ? "text-yellow-400" : "text-blue-400"}`}>
                                                    {isSystem ? "[SYSTEM]" : `[${msg.senderName.slice(0, 8)}]:`}
                                                </span>{" "}
                                                <span className={`${isSystem ? "text-yellow-100 italic" : "text-white"} drop-shadow-sm break-words`}>
                                                    {isSystem && <span className="mr-1">🎲</span>}
                                                    {msg.message}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Emoji Picker */}
                                <AnimatePresence>
                                    {showEmoji && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden border-t border-white/10 bg-black/50"
                                        >
                                            <div className="grid grid-cols-8 gap-0.5 p-1.5">
                                                {QUICK_EMOJIS.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => setMessage(prev => prev + emoji)}
                                                        className="text-base hover:bg-white/15 rounded p-1 transition-colors active:scale-90"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Input */}
                                <div className="p-2 bg-black/40 border-t border-white/10 flex gap-1.5 items-center">
                                    <button
                                        onClick={() => setShowEmoji(!showEmoji)}
                                        className={`shrink-0 text-base p-1.5 rounded-lg transition-colors ${showEmoji ? 'bg-white/20' : 'hover:bg-white/10'}`}
                                        title="Emoji"
                                    >
                                        😀
                                    </button>
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        placeholder="Ketik pesan..."
                                        className="flex-1 min-w-0 bg-white/10 text-white text-xs px-3 py-2.5 rounded-lg border border-white/10 focus:border-white/40 outline-none placeholder:text-white/40 transition-all focus:bg-white/20"
                                    />
                                    <button
                                        onClick={handleSend}
                                        className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2.5 rounded-lg transition-colors font-medium"
                                    >
                                        Kirim
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Toggle Bar */}
                <button
                    onClick={() => { onToggle(); setShowEmoji(false); }}
                    className="w-full bg-black/80 backdrop-blur-md text-white/90 py-2.5 px-4 flex items-center justify-between border-t border-white/10 hover:bg-black/90 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span className="text-xs font-semibold tracking-wide uppercase">Chat Room</span>
                        {messages.length > 0 && !isOpen && (
                            <span className="text-[10px] bg-blue-500/80 text-white px-1.5 py-0.5 rounded-full font-bold">
                                {messages.length}
                            </span>
                        )}
                    </div>
                    <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-white/60"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </motion.span>
                </button>
            </div>
        </div>
    );
}
