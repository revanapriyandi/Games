import { motion } from "framer-motion";
import { ROLES } from "../../lib/roles";

interface RoleSelectionModalProps {
    roleIds: string[];
    onSelect: (roleId: string) => void;
}

export function RoleSelectionModal({ roleIds, onSelect }: RoleSelectionModalProps) {
    const rolesToDisplay = ROLES.filter(r => roleIds.includes(r.id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="w-full max-w-4xl flex flex-col items-center gap-8"
            >
                <div className="text-center space-y-2">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-block bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest border border-indigo-500/30"
                    >
                        Class Shrine Discovered
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]">
                        Choose Your Destiny
                    </h2>
                    <p className="text-gray-300 max-w-lg mx-auto">
                        You have stumbled upon an ancient shrine. Three paths lie before you. Choose wisely, for this decision will shape your journey.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {rolesToDisplay.map((role, index) => (
                        <motion.button
                            key={role.id}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 + (index * 0.15) }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSelect(role.id)}
                            className="relative group bg-slate-900/80 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 text-center overflow-hidden hover:border-indigo-500/50 hover:bg-slate-800 transition-all shadow-2xl"
                        >
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 text-6xl md:text-7xl mb-2 filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                                {role.emoji}
                            </div>

                            <div className="relative z-10 space-y-1">
                                <h3 className="text-2xl font-bold text-white uppercase tracking-wide group-hover:text-indigo-300 transition-colors">
                                    {role.name}
                                </h3>
                                <div className="h-px w-12 bg-white/20 mx-auto my-2 group-hover:w-24 group-hover:bg-indigo-500 transition-all duration-300" />
                            </div>

                            <div className="relative z-10 space-y-3 flex-1">
                                <p className="text-sm text-gray-300 italic">"{role.description}"</p>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mb-1">Special Ability</p>
                                    <p className="text-xs text-gray-200 font-medium leading-relaxed">{role.ability}</p>
                                </div>
                            </div>

                            <div className="relative z-10 mt-auto pt-4 w-full">
                                <div className="w-full py-3 bg-white/5 hover:bg-indigo-600 hover:text-white border border-white/10 hover:border-indigo-500 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300">
                                    Select Class
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
