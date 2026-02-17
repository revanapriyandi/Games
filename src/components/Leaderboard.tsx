import { useEffect, useState } from "react";
import { getLeaderboard, type LeaderboardEntry } from "../lib/leaderboard";
import { motion } from "framer-motion";
import { Trophy, Award, Medal, Crown } from "lucide-react";

export function Leaderboard() {
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaderboard().then((data) => {
            setLeaders(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div className="text-center p-8 text-white/50 animate-pulse">Loading Leaderboard...</div>;
    }

    return (
        <div className="w-full bg-slate-900/50 border border-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-white/5">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-yellow-500">
                    <Trophy className="w-8 h-8" />
                    Wall of Legends
                </h2>
                <p className="text-white/40 mt-1 text-sm">Top adventurers who conquered the challenges</p>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {leaders.length === 0 ? (
                    <div className="text-center text-white/50 py-12 flex flex-col items-center gap-4">
                        <Trophy className="w-12 h-12 text-white/20" />
                        <p>No legends yet. Be the first to win!</p>
                    </div>
                ) : (
                    leaders.map((player, index) => (
                        <motion.div
                            key={player.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border
                                ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                                    index === 1 ? 'bg-zinc-500/10 border-zinc-500/30' :
                                        index === 2 ? 'bg-amber-700/10 border-amber-700/30' :
                                            'bg-white/5 border-white/5 hover:bg-white/10'}
                            `}
                        >
                            <div className="shrink-0 w-8 text-center font-bold text-lg">
                                {index === 0 && <Crown className="w-6 h-6 text-yellow-500 mx-auto" />}
                                {index === 1 && <Medal className="w-6 h-6 text-zinc-400 mx-auto" />}
                                {index === 2 && <Award className="w-6 h-6 text-amber-700 mx-auto" />}
                                {index > 2 && <span className="text-white/30">#{index + 1}</span>}
                            </div>

                            <img
                                src={player.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`}
                                alt={player.name}
                                className="w-12 h-12 rounded-full border-2 border-white/10 bg-slate-800 object-cover"
                            />

                            <div className="grow min-w-0">
                                <h3 className={`font-bold truncate text-lg ${index === 0 ? 'text-yellow-400' : 'text-white'
                                    }`}>
                                    {player.name}
                                </h3>
                                <p className="text-xs text-white/40">
                                    {player.gamesPlayed > 0
                                        ? `${player.gamesPlayed} games played`
                                        : 'New Challenger'
                                    }
                                </p>
                            </div>

                            <div className="text-right pl-4 border-l border-white/10">
                                <span className={`block font-black text-2xl ${index === 0 ? 'text-yellow-400' : 'text-white'
                                    }`}>
                                    {player.wins}
                                </span>
                                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Wins</span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

