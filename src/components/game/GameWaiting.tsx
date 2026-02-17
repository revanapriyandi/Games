import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import type { Player } from "../../lib/types";
import { kickPlayer, startGame } from "../../lib/game";
import { getAvatarImage } from "../KnightAvatar";
import { Copy, User, Crown, AlertTriangle, ShieldAlert, Settings } from "lucide-react";
import type { HouseRules } from "../../lib/types";

interface GameWaitingProps {
    roomId: string;
    players: Player[];
    playerId: string;
    isHost: boolean;
    onLeave: () => void;
    onCopy: () => void;
    copied: boolean;
    stakes?: string | null;
    onChangeStakes?: (val: string) => void;
    stakesAcceptedBy?: string[];
    onAcceptStakes?: () => void;
    rules?: HouseRules;
    onUpdateRules?: (rules: HouseRules) => void;
    onAddBot?: () => void;
}

export function GameWaiting({ roomId, players, playerId, isHost, onLeave, onCopy, copied, stakes, onChangeStakes, stakesAcceptedBy, onAcceptStakes, rules, onUpdateRules, onAddBot }: GameWaitingProps) {
    const [isStakesModalOpen, setIsStakesModalOpen] = useState(false);
    const hasStakes = !!stakes && stakes.trim().length > 0;
    const allAccepted = !hasStakes || (stakesAcceptedBy && players.every(p => stakesAcceptedBy.includes(p.id)));
    const iAccepted = !hasStakes || (stakesAcceptedBy && stakesAcceptedBy.includes(playerId));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-[400px] w-full mx-auto p-6 bg-slate-900/80 backdrop-blur-xl rounded-2xl text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
        >
            {/* Header / Room Code */}
            <div className="mb-6 relative flex flex-col items-center">
                 <div className="-mt-3 mb-2 px-3 py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold tracking-widest uppercase border border-yellow-500/20 rounded-full">
                    Lobby Area
                 </div>
                 <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">KODE RUANG</h2>
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
                    {isHost && players.length < 4 && (
                        <button 
                            onClick={onAddBot}
                            className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                        >
                            <span>🤖</span> +Bot
                        </button>
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
                                    ? "bg-indigo-950/60 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                                    : "bg-white/5 border-white/5 hover:bg-white/10"
                            }`}
                        >
                            <div className="relative">
                                <img
                                    src={p.customAvatarUrl || getAvatarImage(p.avatar, idx)}
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

                            {/* Agreed Status */}
                            {hasStakes && stakesAcceptedBy?.includes(p.id) && (
                                <div className="text-green-400" title="Setuju">
                                    <span className="text-xs">✅</span>
                                </div>
                            )}

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

            {/* Stakes Input */}
            <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                    <Crown size={12} />
                    Hadiah / Taruhan
                </h3>
                {isHost ? (
                    <div className="relative">
                        <input
                            type="text"
                            value={stakes || ""}
                            onChange={(e) => onChangeStakes?.(e.target.value)}
                            placeholder="Contoh: Yang kalah traktir kopi ☕"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-center text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                        />
                        <div className="absolute inset-x-0 -bottom-3 text-[9px] text-gray-500">
                             Jika diubah, persetujuan akan di-reset.
                        </div>
                    </div>
                ) : (
                    <div className="text-sm font-medium text-white italic truncate max-w-[250px] mx-auto">
                        "{stakes || "Belum ada taruhan..."}"
                    </div>
                )}

                {/* Agreement Button */}
                {hasStakes && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                        {!iAccepted ? (
                            <Button
                                onClick={() => setIsStakesModalOpen(true)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-500 text-white font-bold animate-pulse shadow-lg shadow-green-900/20"
                            >
                                👍 TINJAU & SETUJU
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setIsStakesModalOpen(true)}
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 text-gray-300 font-bold border border-white/10"
                            >
                                📜 LIHAT TARUHAN
                            </Button>
                        )}
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                            {stakesAcceptedBy?.length || 0}/{players.length} Pemain Setuju
                        </div>
                    </div>
                )}
            </div>

            {/* Stakes Modal */}
            <AnimatePresence>
                {isStakesModalOpen && stakes && (
                    <StakesModal
                        stakes={stakes}
                        onClose={() => setIsStakesModalOpen(false)}
                        onAccept={() => {
                            onAcceptStakes?.();
                            setIsStakesModalOpen(false);
                        }}
                        players={players}
                        stakesAcceptedBy={stakesAcceptedBy}
                        playerId={playerId}
                    />
                )}
            </AnimatePresence>




            {/* House Rules Section */}
            <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/5 text-left">
                <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Settings size={12} />
                    Variasi Aturan Game
                </h3>
                
                <div className="space-y-2">
                    {/* Strict Finish Rule */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5">
                        <div>
                            <div className="text-xs text-white font-bold">Exact Win Only</div>
                            <div className="text-[9px] text-gray-400">Harus dadu pas untuk finish (100).</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={!!rules?.strictFinish}
                                disabled={!isHost}
                                onChange={(e) => isHost && onUpdateRules?.({ ...(rules || { strictFinish: false, doubleSnake: false, noShield: false }), strictFinish: e.target.checked })}
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Double Snake Rule */} // Temporarily just visual/flag
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5">
                        <div>
                            <div className="text-xs text-white font-bold">Double Snake Penalty</div>
                            <div className="text-[9px] text-gray-400">Turun ular lebih jauh / menyakitkan.</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={!!rules?.doubleSnake}
                                disabled={!isHost}
                                onChange={(e) => isHost && onUpdateRules?.({ ...(rules || { strictFinish: false, doubleSnake: false, noShield: false }), doubleSnake: e.target.checked })}
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {isHost ? (
                    <Button
                        onClick={() => startGame(roomId)}
                        disabled={players.length < 2 || !allAccepted}
                        className={`w-full py-6 text-lg font-bold shadow-xl transition-all ${
                            players.length < 2 || !allAccepted
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed border border-white/5"
                                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border border-indigo-400/30 hover:shadow-indigo-500/20"
                        }`}
                    >
                        {players.length < 2 ? "MENUNGGU PEMAIN..." : !allAccepted ? "MENUNGGU PERSETUJUAN..." : "⚔️ MULAI GAME"}
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

interface StakesModalProps {
    stakes: string;
    onClose: () => void;
    onAccept: () => void;
    players: Player[];
    stakesAcceptedBy?: string[];
    playerId: string;
}

function StakesModal({ stakes, onClose, onAccept, players, stakesAcceptedBy, playerId }: StakesModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-yellow-500/30 w-full max-w-md p-6 rounded-2xl shadow-2xl relative"
            >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                    <div className="bg-yellow-500 text-black p-3 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.5)] border-4 border-slate-900">
                        <Crown size={32} fill="currentColor" />
                    </div>
                </div>

                <h3 className="text-yellow-400 text-center font-bold text-lg mt-6 mb-2 uppercase tracking-widest">
                    Kesepakatan Taruhan
                </h3>
                
                <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                    <p className="text-white text-lg font-medium text-center leading-relaxed">
                        "{stakes}"
                    </p>
                </div>

                <div className="mb-6">
                    <h4 className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 text-center">Status Pemain</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                        {players.map((p) => {
                            const agreed = stakesAcceptedBy?.includes(p.id);
                            return (
                                <div key={p.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs ${
                                    agreed 
                                    ? "bg-green-500/20 border-green-500/40 text-green-300"
                                    : "bg-white/5 border-white/10 text-gray-500 grayscale opacity-50"
                                }`}>
                                    <img src={getAvatarImage(p.avatar)} className="w-4 h-4" />
                                    <span>{p.name}</span>
                                    {agreed && <span>✅</span>}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5 text-gray-400">
                        Kembali
                    </Button>
                    <Button 
                        onClick={onAccept} 
                        className="bg-green-600 hover:bg-green-500 text-white font-bold"
                        disabled={stakesAcceptedBy?.includes(playerId)}
                    >
                        {stakesAcceptedBy?.includes(playerId) ? "Sudah Setuju 👍" : "Saya Setuju 🤝"}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
