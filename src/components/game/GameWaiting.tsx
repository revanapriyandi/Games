import { motion } from "framer-motion";
import { Button } from "../ui/button";
import type { Player } from "../../lib/types";
import { kickPlayer, startGame } from "../../lib/game";
import { getAvatarImage } from "../KnightAvatar";
import { Copy, User, Crown, AlertTriangle, ShieldAlert } from "lucide-react";

interface GameWaitingProps {
    roomId: string;
    players: Player[];
    playerId: string;
    isHost: boolean;
    onLeave: () => void;
    onCopy: () => void;
    copied: boolean;
}

export function GameWaiting({ roomId, players, playerId, isHost, onLeave, onCopy, copied }: GameWaitingProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-[360px] w-full mx-auto p-6 bg-slate-900/80 backdrop-blur-xl rounded-2xl text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
        >
            {/* Header / Room Code */}
            <div className="mb-6 relative">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold tracking-widest uppercase border border-yellow-500/20 rounded-full">
                    Lobby Area
                 </div>
                 <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 mt-4">KODE RUANG</h2>
                 <button
                    onClick={onCopy}
                    className="group relative inline-flex items-center justify-center gap-3 px-6 py-3 bg-black/50 hover:bg-black/70 rounded-xl border border-white/10 hover:border-white/30 transition-all w-full active:scale-95"
                    title="Salin Kode"
                 >
                    <span className="text-3xl font-mono font-bold text-white tracking-widest group-hover:text-yellow-400 transition-colors">
                        {roomId}
                    </span>
                    <div className="absolute right-4 text-white/20 group-hover:text-white/80 transition-colors">
                        {copied ? <span className="text-green-400 text-[10px] font-bold">DISALIN!</span> : <Copy size={16} />}
                    </div>
                 </button>
            </div>

            {/* Player List */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                        <User size={12} />
                        Pemain ({players.length}/4)
                    </h3>
                    {players.length < 2 && (
                         <span className="text-[10px] text-red-400 flex items-center gap-1 animate-pulse">
                            <AlertTriangle size={10} />
                            Butuh min. 2
                         </span>
                    )}
                </div>

                <div className="space-y-2">
                    {players.map((p, idx) => (
                        <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            key={p.id}
                            className={`relative flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                p.id === playerId
                                    ? "bg-indigo-900/20 border-indigo-500/30 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]"
                                    : "bg-white/5 border-white/5 hover:bg-white/10"
                            }`}
                        >
                            <div className="relative">
                                <img
                                    src={getAvatarImage(p.avatar, idx)}
                                    alt={p.name}
                                    className="w-9 h-9 object-contain drop-shadow-md"
                                />
                                {p.isHost && (
                                    <div className="absolute -top-1 -right-1 text-yellow-500 bg-black rounded-full p-0.5 border border-yellow-500/30 shadow-sm" title="Host">
                                        <Crown size={10} fill="currentColor" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className={`text-sm font-bold truncate w-full text-left ${p.id === playerId ? "text-indigo-300" : "text-gray-200"}`}>
                                    {p.name}
                                </span>
                                {p.id === playerId && (
                                    <span className="text-[9px] text-indigo-400/70 font-medium uppercase tracking-wide">It's You</span>
                                )}
                            </div>

                            {/* Kick Button (Host only) */}
                            {isHost && p.id !== playerId && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Keluarkan ${p.name}?`)) kickPlayer(roomId, p.id);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                    title="Keluarkan"
                                >
                                    <ShieldAlert size={14} />
                                </button>
                            )}
                        </motion.div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: 4 - players.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex items-center justify-center p-3 rounded-xl border border-white/5 bg-black/20 border-dashed text-white/10 text-xs font-medium">
                            Menunggu...
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {isHost ? (
                    <Button
                        onClick={() => startGame(roomId)}
                        disabled={players.length < 2}
                        className={`w-full py-6 text-lg font-bold shadow-xl transition-all ${
                            players.length < 2
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed border border-white/5"
                                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border border-indigo-400/30 hover:shadow-indigo-500/20"
                        }`}
                    >
                        {players.length < 2 ? "MENUNGGU PEMAIN..." : "⚔️ MULAI GAME"}
                    </Button>
                ) : (
                    <div className="w-full py-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-gray-400 animate-pulse text-xs font-medium uppercase tracking-wider">
                         <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"/>
                         Menunggu Host...
                    </div>
                )}

                <Button
                    variant="ghost"
                    onClick={onLeave}
                    className="w-full h-8 text-xs text-red-400/60 hover:text-red-400 hover:bg-transparent font-medium"
                >
                    TINGGALKAN ROOM
                </Button>
            </div>
        </motion.div>
    );
}
