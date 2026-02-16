import { motion } from "framer-motion";
import { useEffect } from "react";
import { Button } from "./ui/button";
import { playWinSound, playLoseSound } from "../lib/sounds";
import type { Player } from "../lib/game";
import { getAvatarImage } from "./KnightAvatar";

interface WinnerModalProps {
    winnerId: string;
    players: Player[];
    currentPlayerId: string;
    onReset: () => void;
    onExit: () => void;
}

export function WinnerModal({ winnerId, players, currentPlayerId, onReset, onExit }: WinnerModalProps) {
    const winner = players.find(p => p.id === winnerId);
    const losers = players.filter(p => p.id !== winnerId).sort((a, b) => (b.position || 0) - (a.position || 0));
    const isWinner = currentPlayerId === winnerId;

    useEffect(() => {
        if (isWinner) {
            playWinSound();
        } else {
            playLoseSound();
        }
    }, [isWinner]);

    if (!winner) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            {/* Confetti effect for winner can be added here later */}
            
            <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="bg-gradient-to-br from-yellow-400 to-orange-500 p-1 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="bg-black/90 p-6 rounded-xl text-center flex flex-col items-center">
                    
                    {/* WINNER SECTION */}
                    <div className="mb-8 relative">
                        <motion.div 
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-6xl absolute -top-10 -left-10 z-10"
                        >
                            👑
                        </motion.div>
                        <motion.div 
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            className="text-6xl absolute -top-10 -right-10 z-10"
                        >
                            🎉
                        </motion.div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                            <img 
                                src={getAvatarImage(winner.avatar, 0)} 
                                alt={winner.name} 
                                className="w-32 h-32 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                            />
                        </div>

                        <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mt-4 uppercase tracking-wider">
                            {isWinner ? "KAMU MENANG!" : `${winner.name} MENANG!`}
                        </h3>
                        <p className="text-gray-400 text-sm italic mt-1">
                            {isWinner ? "Selamat! Kamu adalah juara sejati!" : "Jangan menyerah, coba lagi!"}
                        </p>
                    </div>

                    {/* LOSERS LIST */}
                    {losers.length > 0 && (
                        <div className="w-full bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                            <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest text-left">Peringkat Lainnya</h4>
                            <div className="space-y-3">
                                {losers.map((p, idx) => (
                                    <div key={p.id} className="flex items-center gap-3 bg-black/40 p-2 rounded border border-white/5">
                                        <span className="text-gray-500 font-mono font-bold text-sm w-4">#{idx + 2}</span>
                                        <img src={getAvatarImage(p.avatar, idx + 1)} alt={p.name} className="w-8 h-8 object-contain opacity-70 grayscale-[0.5]" />
                                        <div className="text-left flex-1 min-w-0">
                                            <div className="text-gray-300 text-sm font-medium truncate">
                                                {p.name} {p.id === currentPlayerId && <span className="text-xs text-red-400">(Kamu)</span>}
                                            </div>
                                            <div className="text-[10px] text-gray-600">
                                                Petak {p.position || 1}
                                            </div>
                                        </div>
                                        {p.id === currentPlayerId && (
                                            <span className="text-xl">😭</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="w-full space-y-3">
                        <Button 
                            onClick={onReset} 
                            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-6 text-lg shadow-lg hover:scale-[1.02] transition-all"
                        >
                            🔄 Main Lagi
                        </Button>
                        <Button 
                            onClick={onExit} 
                            variant="ghost"
                            className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                            🚪 Kembali ke Lobby
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
