import { motion } from "framer-motion";
import { Button } from "../ui/button";
import type { Player } from "../../lib/types";
import { kickPlayer, startGame } from "../../lib/game";
import { getAvatarImage } from "../KnightAvatar";

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md w-full mx-auto p-8 bg-white/10 backdrop-blur-md rounded-xl text-center shadow-2xl border border-white/20"
        >
            <h2 className="text-2xl font-bold text-white mb-2">
                Kode Ruang: <span onClick={onCopy} className="text-yellow-400 tracking-wider font-mono bg-black/40 px-2 rounded-md border border-yellow-500/50 cursor-pointer hover:bg-white/20 transition-all select-none" title="Klik untuk menyalin">{copied ? "DISALIN!" : roomId}</span>
            </h2>
            <p className="text-gray-300 mb-2 font-light">Bagikan kode ini ke temanmu!</p>
            <p className="text-gray-400 mb-6 text-xs">📱 Max 4 pemain. Buka game di HP lain dan masukkan kode ini.</p>

            <div className="space-y-3 mb-8 text-left">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-1">Ksatria ({players.length}/4)</h3>
                {players.map((p, idx) => (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        key={p.id}
                        className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5"
                    >
                        <img src={getAvatarImage(p.avatar, idx)} alt={p.name} className="w-10 h-10 object-contain" />
                        <span className="text-white font-medium">{p.name} {p.id === playerId && <span className="text-gray-400 text-xs font-normal">(Kamu)</span>}</span>

                        {/* Host Badge */}
                        {p.isHost && <span className="ml-auto text-[10px] uppercase font-bold bg-yellow-500 text-black px-2 py-1 rounded shadow-lg">HOST</span>}

                        {/* Kick Button (only for Host, not on self) */}
                        {isHost && p.id !== playerId && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Keluarkan ${p.name}?`)) kickPlayer(roomId, p.id);
                                }}
                                className="ml-auto px-3 py-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold rounded-lg shadow-lg border border-red-400/30 flex items-center gap-1 transition-all active:scale-95 group"
                                title="Keluarkan Pemain"
                            >
                                <span className="group-hover:scale-110 transition-transform">⛔</span>
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>

            {isHost ? (
                <Button
                    onClick={() => startGame(roomId)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-700 hover:from-green-600 hover:to-emerald-800 text-white font-bold py-6 text-xl shadow-xl transition-all hover:scale-[1.02]"
                >
                    ⚔️ MULAI PERMAINAN
                </Button>
            ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400 animate-pulse bg-white/5 py-3 rounded-lg">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"/>
                    Menunggu host memulai permainan...
            </div>
            )}

            <Button
                variant="ghost"
                onClick={onLeave}
                className="w-full mt-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs uppercase tracking-wider"
            >
                Keluar Room
            </Button>
        </motion.div>
    );
}
