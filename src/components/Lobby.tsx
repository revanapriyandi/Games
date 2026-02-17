import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { createRoom, joinRoom } from "../lib/game";
import { generateGameContent } from "../lib/gemini";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarSelector } from "./ui/AvatarSelector";
import { THEME_PRESETS, getRandomName } from "../lib/constants";
import { ROLES, getRole } from "../lib/roles";
import { getAvatarUrl } from "../lib/avatar";
import type { AIConfig } from "../lib/types";

interface LobbyProps {
  onJoin: (roomId: string, playerId: string) => void;
}

export function Lobby({ onJoin }: LobbyProps) {
  const [name, setName] = useState(() => getRandomName());
  const [roleId, setRoleId] = useState(ROLES[0].id);
  // Default avatar based on random name
  const [avatarUrl, setAvatarUrl] = useState(() => getAvatarUrl('adventurer', name));

  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // AI Theme state
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customTheme, setCustomTheme] = useState("");

  const activeTheme = selectedPreset === "custom" ? customTheme.trim() : selectedPreset;
  const currentRole = getRole(roleId);

  // Update avatar if name changes (optional, but maybe nice? No, let's keep them separate so user can customize)
  // Actually, let's NOT auto-update avatar when name changes to respect manual selection.

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
      const { roomId, playerId } = await createRoom(name, roleId, avatarUrl, aiConfig);
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
      const { roomId, playerId } = await joinRoom(roomCode.toUpperCase(), name, roleId, avatarUrl);
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
        <div className="relative p-8 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-b md:border-b-0 md:border-r border-white/5">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

          <motion.div
            layout
            className="relative z-10 flex flex-col items-center space-y-6"
          >
            {/* Avatar Preview Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <motion.div
                key={avatarUrl}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-48 h-48 md:w-64 md:h-64 rounded-2xl border-4 border-white/10 bg-black/40 shadow-2xl overflow-hidden relative"
              >
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />

                {/* Role Badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg">
                  <span className="text-2xl">{currentRole?.emoji}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{currentRole?.name}</span>
                    <span className="text-[10px] text-gray-400">Class</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-3xl font-bold text-white tracking-tight">{name || "Anonymous Hero"}</h2>
              <p className="text-indigo-300/80 font-medium">Ready for Adventure</p>
            </div>

            {/* Role Ability Preview */}
             <div className="bg-white/5 border border-white/10 p-4 rounded-xl max-w-xs text-center backdrop-blur-sm">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Special Ability</p>
                <p className="text-sm text-gray-200">{currentRole?.ability}</p>
             </div>
          </motion.div>
        </div>

        {/* Right Column: Controls */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
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

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Choose Class</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setRoleId(role.id as any)}
                    className={`
                      p-2 rounded-xl border transition-all flex flex-col items-center gap-1
                      ${roleId === role.id
                        ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10"
                        : "bg-black/20 border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10"}
                    `}
                  >
                    <span className="text-2xl">{role.emoji}</span>
                    <span className="text-xs font-bold">{role.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Theme */}
             <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <span>✨ Adventure Theme</span>
                    <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full">AI Powered</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                    <select
                        value={selectedPreset}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/40 appearance-none cursor-pointer hover:bg-black/30 transition-colors"
                    >
                        {THEME_PRESETS.map((t) => (
                            <option key={t.value} value={t.value} className="bg-gray-900 text-gray-300">
                                {t.label}
                            </option>
                        ))}
                    </select>
                    <AnimatePresence>
                        {selectedPreset === "custom" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <Input
                                    value={customTheme}
                                    onChange={(e) => setCustomTheme(e.target.value)}
                                    placeholder="Describe your custom adventure..."
                                    className="bg-purple-900/10 border-purple-500/20 text-white placeholder:text-gray-600 text-sm"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handleCreate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-6 text-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all rounded-xl"
              >
                 {isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{activeTheme ? "Generating World..." : "Creating Room..."}</span>
                    </div>
                 ) : (
                    "Create New Adventure"
                 )}
              </Button>

              <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-gray-500">Or Join Existing</span></div>
              </div>

               <div className="flex gap-2">
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="ROOM CODE"
                  className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 text-center uppercase tracking-widest font-mono"
                />
                <Button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-8"
                >
                  JOIN
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
