import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import type { Player, AIConfig } from "../../lib/types";
import { kickPlayer, startGame } from "../../lib/game";
import { getAvatarImage } from "../KnightAvatar";
import { Copy, User, Crown, AlertTriangle, ShieldAlert, Settings, Sparkles, X, Edit2 } from "lucide-react";
import { THEME_PRESETS } from "../../lib/constants";
import { Input } from "../ui/input";
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
    aiConfig?: AIConfig;
    onUpdateAIConfig?: (config: Partial<AIConfig>) => void;
}

export function GameWaiting({ roomId, players, playerId, isHost, onLeave, onCopy, copied, stakes, onChangeStakes, stakesAcceptedBy, onAcceptStakes, rules, onUpdateRules, aiConfig, onUpdateAIConfig }: GameWaitingProps) {
    const [isStakesModalOpen, setIsStakesModalOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [customTheme, setCustomTheme] = useState("");

    // Find matching preset or default to custom if theme exists but not in presets
    const currentThemeValue = aiConfig?.theme
        ? (THEME_PRESETS.find(p => p.label.includes(aiConfig.theme) || aiConfig.theme.includes(p.value))?.value || 'custom')
        : "";

    const [selectedPreset, setSelectedPreset] = useState(currentThemeValue);

    const hasStakes = !!stakes && stakes.trim().length > 0;
    const allAccepted = !hasStakes || (stakesAcceptedBy && players.every(p => stakesAcceptedBy.includes(p.id)));
    const iAccepted = !hasStakes || (stakesAcceptedBy && stakesAcceptedBy.includes(playerId));

    const handleThemeUpdate = (val: string) => {
        if (!onUpdateAIConfig) return;

        let themeToSave = val;
        // If selecting a preset, use the label or value appropriately
        const preset = THEME_PRESETS.find(p => p.value === val);
        if (preset && val !== 'custom') {
            themeToSave = preset.label; // Or handle based on how backend expects it.
            // Actually, looks like Lobby uses: activeTheme = selectedPreset === "custom" ? customTheme : selectedPreset
            // But here we want the readable name usually.
            // Let's stick to what Lobby does or simplify. Lobby does: 
            // const activeTheme = selectedPreset === "custom" ? customTheme.trim() : selectedPreset;
            // Wait, looking at Lobby.tsx line 70:
            /*
            if (activeTheme) {
                const content = await generateGameContent(activeTheme);
                aiConfig = { theme: activeTheme, ...content };
            }
            */
            // So if selectedPreset is likely "horror spooky...", that string is saved as theme.
            onUpdateAIConfig({ theme: themeToSave });
        } else if (val === 'custom') {
            // For custom, allow modal to handle the specific input save
            // We'll handle custom save in the modal "PILIH" button
        }
    };

    const saveCustomTheme = () => {
        if (onUpdateAIConfig && customTheme.trim()) {
            onUpdateAIConfig({ theme: customTheme.trim() });
            setIsThemeModalOpen(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-6"
        >
            {/* Header: Room Info */}
            <div className="bg-[#0a0a0b]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 animate-gradient-xy transition-opacity group-hover:opacity-100 opacity-50" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left space-y-1">
                        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            ADVENTURE LOBBY
                        </h2>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            Waiting for Heroes
                        </h1>
                        <p className="text-gray-500 text-sm">Prepare your party before entering the dungeon.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ROOM CODE</span>
                            <span className="text-xl font-mono font-bold text-white tracking-widest">{roomId}</span>
                        </div>
                        <Button
                            onClick={onCopy}
                            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        >
                            {copied ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-2">
                                    Link Copied! <span className="text-lg">✅</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Copy size={16} /> Copy Invite Link
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Player Roster (Merged) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-[#0a0a0b]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl min-h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <User size={16} className="text-indigo-400" />
                                Party Roster <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white">{players.length}/4</span>
                            </h3>
                            {players.length < 2 && (
                                <div className="text-[10px] text-red-400 font-bold animate-pulse flex items-center gap-1.5">
                                    <AlertTriangle size={12} />
                                    NEED 2+ PLAYERS
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 flex-1">
                            {players.map((p, idx) => (
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={p.id}
                                    className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all group ${p.id === playerId
                                        ? "bg-gradient-to-r from-indigo-900/20 to-transparent border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                        : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
                                        }`}
                                >
                                    {/* Avatar & Badge */}
                                    <div className="relative shrink-0">
                                        <div className={`w-14 h-14 rounded-xl bg-black/40 flex items-center justify-center p-1.5 border-2 ${p.id === playerId ? 'border-indigo-500/50' : 'border-white/10'}`}>
                                            <img
                                                src={p.customAvatarUrl || getAvatarImage(p.avatar, idx)}
                                                alt={p.name}
                                                className="w-full h-full object-contain filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                        {p.isHost && (
                                            <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-300 to-yellow-600 text-black p-1.5 rounded-full shadow-lg border border-yellow-200" title="Party Leader">
                                                <Crown size={12} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Player Info */}
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-base font-bold truncate ${p.id === playerId ? "text-indigo-300" : "text-gray-200"}`}>
                                                    {p.name}
                                                </span>
                                                {p.id === playerId && (
                                                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold uppercase tracking-wider">You</span>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            {hasStakes ? (
                                                <div className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${stakesAcceptedBy?.includes(p.id)
                                                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                                                    : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500/50"}`}>
                                                    {stakesAcceptedBy?.includes(p.id) ? "Ready" : "Reviewing"}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-bold px-2 py-1 rounded border bg-white/5 border-white/10 text-gray-500 uppercase tracking-wider">
                                                    Waiting
                                                </div>
                                            )}
                                        </div>

                                        {/* Host Controls */}
                                        {isHost && p.id !== playerId && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`Kick ${p.name}?`)) kickPlayer(roomId, p.id);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title={`Kick ${p.name}`}
                                                >
                                                    <ShieldAlert size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Empty Slots */}
                            {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex items-center justify-center p-4 h-24 rounded-xl border border-white/5 bg-black/20 border-dashed text-white/10 text-xs font-medium group hover:bg-white/[0.02] transition-colors">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <User size={14} className="opacity-20" />
                                        </div>
                                        <span className="group-hover:text-white/20 transition-colors">Waiting for hero...</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings & Actions */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Game Rules / Settings */}
                    <div className="bg-[#0a0a0b]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl space-y-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                            <Settings size={14} />
                            Mission Parameters
                        </h3>

                        {/* Theme Section */}
                        <div className="space-y-3 p-4 rounded-xl border border-purple-500/20 bg-purple-900/10">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles size={12} /> Adventure Theme
                                </label>
                                {isHost && <span className="text-[9px] text-gray-500">Host Only</span>}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white flex items-center gap-2 min-h-[40px]">
                                    {aiConfig?.theme ? (
                                        <>
                                            <span className="text-lg">✨</span>
                                            <span className="font-medium truncate">{aiConfig.theme}</span>
                                        </>
                                    ) : (
                                        <span className="text-gray-500 italic">No specific theme selected</span>
                                    )}
                                </div>
                                {isHost && (
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-10 w-10 border-white/10 hover:bg-white/5"
                                        onClick={() => setIsThemeModalOpen(true)}
                                    >
                                        <Edit2 size={14} />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Stakes Section */}
                        <div className="space-y-3 bg-white/[0.03] p-4 rounded-xl border border-white/5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-yellow-500/90 uppercase tracking-wider flex items-center gap-2">
                                    <Crown size={12} /> Stakes & Rewards
                                </label>
                                {isHost && <span className="text-[9px] text-gray-500">Edit to reset approval</span>}
                            </div>

                            {isHost ? (
                                <textarea
                                    value={stakes || ""}
                                    onChange={(e) => onChangeStakes?.(e.target.value)}
                                    placeholder="e.g. Loser buys lunch 🍔"
                                    rows={2}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
                                />
                            ) : (
                                <div className="text-sm font-medium text-gray-300 italic p-3 bg-black/20 rounded-lg border border-white/5 text-center min-h-[60px] flex items-center justify-center">
                                    "{stakes || "Just for fun! No stakes set."}"
                                </div>
                            )}

                            {/* Stake Action Button */}
                            {hasStakes && (
                                <Button
                                    onClick={() => setIsStakesModalOpen(true)}
                                    size="sm"
                                    className={`w-full font-bold text-xs uppercase tracking-wide ${!iAccepted
                                        ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 animate-pulse"
                                        : "bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5"
                                        }`}
                                >
                                    {!iAccepted ? "Review & Accept" : "View Stakes"}
                                </Button>
                            )}
                        </div>

                        {/* House Rules Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">House Rules</span>
                            </div>

                            <div className="space-y-2">
                                {/* Rule Item: Strict Finish */}
                                <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${rules?.strictFinish ? "bg-blue-500/10 border-blue-500/20" : "bg-black/20 border-white/5"}`}>
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold ${rules?.strictFinish ? "text-blue-300" : "text-gray-400"}`}>Exact Win Only</span>
                                        <span className="text-[9px] text-gray-500 leading-tight mt-0.5">Must roll exact number to hit 100</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!!rules?.strictFinish}
                                            disabled={!isHost}
                                            onChange={(e) => isHost && onUpdateRules?.({ ...(rules || { strictFinish: false, doubleSnake: false, noShield: false }), strictFinish: e.target.checked })}
                                        />
                                        <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                                    </label>
                                </div>

                                {/* Rule Item: Double Snake */}
                                <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${rules?.doubleSnake ? "bg-red-500/10 border-red-500/20" : "bg-black/20 border-white/5"}`}>
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold ${rules?.doubleSnake ? "text-red-300" : "text-gray-400"}`}>Double Snake Penalty</span>
                                        <span className="text-[9px] text-gray-500 leading-tight mt-0.5">Snakes are more dangerous</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!!rules?.doubleSnake}
                                            disabled={!isHost}
                                            onChange={(e) => isHost && onUpdateRules?.({ ...(rules || { strictFinish: false, doubleSnake: false, noShield: false }), doubleSnake: e.target.checked })}
                                        />
                                        <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600 shadow-inner"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Start Action Panel */}
                    <div className="bg-[#0a0a0b]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4">
                        {isHost ? (
                            <Button
                                onClick={() => startGame(roomId)}
                                disabled={players.length < 2 || !allAccepted}
                                className={`w-full py-7 text-lg font-bold shadow-xl transition-all rounded-xl relative overflow-hidden ${players.length < 2 || !allAccepted
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                                    : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-t border-white/20 hover:scale-[1.02] active:scale-[0.98]"
                                    }`}
                            >
                                {players.length < 2 || !allAccepted ? (
                                    <span className="flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                                        {players.length < 2 ? "Waiting for players..." : "Waiting for agreements..."}
                                    </span>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-white/20 animate-pulse-slow mix-blend-overlay" />
                                        <span className="flex items-center justify-center gap-2 relative z-10">
                                            Start Adventure ⚔️
                                        </span>
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="w-full py-6 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-2 text-gray-400 animate-pulse">
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Waiting for Host</span>
                                <span className="text-[10px]">The party leader will start the game soon</span>
                            </div>
                        )}

                        <div className="flex justify-center">
                            <button
                                onClick={onLeave}
                                className="text-xs font-semibold text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-wider hover:underline"
                            >
                                Leave Party
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme Selection Modal */}
            <AnimatePresence>
                {isThemeModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Sparkles className="text-purple-500" size={18} />
                                    Pilih Tema Petualangan
                                </h3>
                                <button
                                    onClick={() => setIsThemeModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto space-y-4 custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {THEME_PRESETS.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => {
                                                setSelectedPreset(t.value);
                                                handleThemeUpdate(t.value);
                                                if (t.value !== 'custom') setIsThemeModalOpen(false);
                                            }}
                                            className={`relative p-3 rounded-xl border text-left transition-all group ${selectedPreset === t.value
                                                ? "bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                                : "bg-black/20 border-white/10 hover:bg-white/5 hover:border-white/20"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    {t.label.split(' ')[0]}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-bold ${selectedPreset === t.value ? "text-white" : "text-gray-300"}`}>
                                                        {t.label.split(' ').slice(1).join(' ')}
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedPreset === t.value && (
                                                <div className="absolute top-3 right-3 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_5px_currentColor]" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {selectedPreset === "custom" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="pt-2"
                                    >
                                        <label className="text-[10px] uppercase font-bold text-purple-400 mb-1 block tracking-wider">Tulis Tema Kamu Sendiri</label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={customTheme}
                                                onChange={(e) => setCustomTheme(e.target.value)}
                                                placeholder="Contoh: Petualangan Bajak Laut Luar Angkasa..."
                                                className="bg-black/40 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-gray-600 text-sm h-11"
                                                autoFocus
                                            />
                                            <Button
                                                onClick={saveCustomTheme}
                                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 px-6 header-btn"
                                            >
                                                PILIH
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                <div key={p.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs ${agreed
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
