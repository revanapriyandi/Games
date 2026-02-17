import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { createRoom, joinRoom } from "../lib/game";
import { generateGameContent } from "../lib/gemini";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarSelector } from "./ui/AvatarSelector";
import { THEME_PRESETS, getRandomName } from "../lib/constants";
import { getAvatarUrl } from "../lib/avatar";
import type { AIConfig } from "../lib/types";
import { Sparkles, X } from "lucide-react";

interface LobbyProps {
    onJoin: (roomId: string, playerId: string) => void;
}

export function Lobby({ onJoin }: LobbyProps) {
    const [name, setName] = useState(() => getRandomName());
    // Default avatar based on random name
    const [avatarUrl, setAvatarUrl] = useState(() => getAvatarUrl('adventurer', name));

    const [roomCode, setRoomCode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // AI Theme state
    const [selectedPreset, setSelectedPreset] = useState("");
    const [customTheme, setCustomTheme] = useState("");

    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

    const activeTheme = selectedPreset === "custom" ? customTheme.trim() : selectedPreset;
    const [showThemeModal, setShowThemeModal] = useState(false);

    // Helper to get label for active theme
    const getActiveThemeLabel = () => {
        const preset = THEME_PRESETS.find(p => p.value === selectedPreset);
        if (selectedPreset === 'custom') return customTheme || "Custom Theme";
        return preset ? preset.label : "Pilih Tema...";
    };

    const handleCreate = async () => {
        if (!name) return setError("Masukkan nama kamu");
        if (selectedPreset === "custom" && !customTheme.trim()) return setError("Tulis tema kustom kamu");
        setIsLoading(true);
        setError("");
        try {
            let aiConfig: AIConfig | undefined;
            if (activeTheme) {
                const content = await generateGameContent(activeTheme);
                aiConfig = { theme: activeTheme, ...content };
            }
            const { roomId, playerId } = await createRoom(name, avatarUrl, aiConfig);
            onJoin(roomId, playerId);
        } catch (err) {
            console.error("Create room error:", err);
            setError("Gagal membuat room: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!name) return setError("Masukkan nama kamu");
        if (!roomCode) return setError("Masukkan kode room");
        setIsLoading(true);
        setError("");
        try {
            const { roomId, playerId } = await joinRoom(roomCode.toUpperCase(), name, avatarUrl);
            onJoin(roomId, playerId);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Gagal bergabung");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl grid md:grid-cols-2 gap-8 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
                {/* Left Column: Hero Preview */}
                <div className="relative p-8 flex flex-col items-center justify-center bg-linear-to-br from-indigo-900/20 to-purple-900/20 border-b md:border-b-0 md:border-r border-white/5">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

                    <motion.div
                        layout
                        className="relative z-10 flex flex-col items-center space-y-6"
                    >
                        {/* Avatar Preview Card */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-linear-to-tr from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                            <motion.div
                                key={avatarUrl}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-48 h-48 md:w-64 md:h-64 rounded-2xl border-4 border-white/10 bg-black/40 shadow-2xl overflow-hidden relative"
                            >
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />

                                {/* No Role Badge initially */}
                                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg">
                                    <span className="text-2xl">🗡️</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">Novice</span>
                                        <span className="text-[10px] text-gray-400">No Class</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="text-center space-y-1">
                            <h2 className="text-3xl font-bold text-white tracking-tight">{name || "Anonymous Hero"}</h2>
                            <p className="text-indigo-300/80 font-medium">Ready for Adventure</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl max-w-xs text-center backdrop-blur-sm">
                            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Objective</p>
                            <p className="text-sm text-gray-200">Find a Class Shrine to unlock your true potential!</p>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Controls */}
                <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400">
                            Customize Your Hero
                        </h1>
                        <p className="text-sm text-gray-500">Prepare yourself before entering the dungeon.</p>
                    </div>

                    <div className="space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Identity</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your hero name..."
                                className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 h-12 text-lg"
                            />
                        </div>

                        {/* Avatar Search */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Appearance</label>
                            <AvatarSelector
                                onSelect={setAvatarUrl}
                                initialAvatar={avatarUrl}
                            />
                        </div>

                        {/* Tabs */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl mb-4">
                            <button
                                onClick={() => setActiveTab('create')}
                                className={`relative py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'create' ? "text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                {activeTab === 'create' && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-indigo-600 rounded-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">Create Adventure</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('join')}
                                className={`relative py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'join' ? "text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                {activeTab === 'join' && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/10 rounded-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">Join Adventure</span>
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'create' ? (
                                <motion.div
                                    key="create-tab"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-4"
                                >
                                    {/* AI Theme Selection Button */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                            <span>✨ Adventure Theme</span>
                                            <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full">AI Powered</span>
                                        </label>

                                        <button
                                            onClick={() => setShowThemeModal(true)}
                                            className="w-full bg-black/20 hover:bg-black/30 border border-purple-500/30 text-left px-4 py-3 rounded-xl flex items-center justify-between group transition-all"
                                        >
                                            <div className="flex items-center gap-2 text-gray-300 group-hover:text-purple-300 transition-colors">
                                                <Sparkles size={16} className="text-purple-500" />
                                                <span className="text-sm font-medium truncate">{getActiveThemeLabel()}</span>
                                            </div>
                                            <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-400 group-hover:text-white transition-colors">GANTI</span>
                                        </button>
                                    </div>

                                    <Button
                                        onClick={handleCreate}
                                        disabled={isLoading}
                                        className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-6 text-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all rounded-xl mt-4"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>{activeTheme ? "Generating World..." : "Creating Room..."}</span>
                                            </div>
                                        ) : (
                                            "Create new Room"
                                        )}
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="join-tab"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Room Code</label>
                                        <Input
                                            value={roomCode}
                                            onChange={(e) => setRoomCode(e.target.value)}
                                            placeholder="ENTER CODE"
                                            className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 text-center uppercase tracking-widest font-mono h-14 text-2xl"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleJoin}
                                        disabled={isLoading}
                                        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-6 text-lg border border-white/10"
                                    >
                                        JOIN ADVENTURE
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Theme Selection Modal */}
                        <AnimatePresence>
                            {showThemeModal && (
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
                                                onClick={() => setShowThemeModal(false)}
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
                                                            if (t.value !== 'custom') setShowThemeModal(false);
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
                                                            onClick={() => setShowThemeModal(false)}
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

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}


                    </div>
                </div>
            </motion.div>
        </div>
    );
}
