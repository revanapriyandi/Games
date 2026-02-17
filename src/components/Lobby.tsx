import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { createRoom, joinRoom } from "../lib/game";
import { generateGameContent } from "../lib/gemini";
import { motion, AnimatePresence } from "framer-motion";
import { KNIGHT_AVATARS } from "./KnightAvatar";
import { THEME_PRESETS, getRandomName } from "../lib/constants";
import { ROLES, getRole } from "../lib/roles";
import type { AIConfig } from "../lib/types";

interface LobbyProps {
  onJoin: (roomId: string, playerId: string) => void;
}

export function Lobby({ onJoin }: LobbyProps) {
  const [name, setName] = useState(() => getRandomName());
  const [roleId, setRoleId] = useState(ROLES[0].id);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // AI Theme state
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customTheme, setCustomTheme] = useState("");

  const activeTheme = selectedPreset === "custom" ? customTheme.trim() : selectedPreset;

  const handleCreate = async () => {
    if (!name) return setError("Masukkan nama kamu");
    if (selectedPreset === "custom" && !customTheme.trim()) return setError("Tulis tema kustom kamu");
    setIsLoading(true);
    setError("");
    try {
      // Auto-generate AI content if theme is selected
      let aiConfig: AIConfig | undefined;
      if (activeTheme) {
        const content = await generateGameContent(activeTheme);
        aiConfig = { theme: activeTheme, ...content };
      }
      const { roomId, playerId } = await createRoom(name, roleId, avatarUrl, aiConfig);
      onJoin(roomId, playerId);
    } catch {
      setError("Gagal membuat room");
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
    <div className="w-full max-w-md mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-slate-900 p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5"
      >
        <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
          ⚔️ Masuk Arena
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nama Kamu</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Sir Lancelot"
              className="bg-black/20 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

           {/* Role Selection */}
           <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Pilih Role</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {ROLES.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setRoleId(role.id as any)}
                  className={`flex-shrink-0 w-32 p-3 rounded-xl border cursor-pointer transition-all ${
                    roleId === role.id
                      ? "bg-indigo-600/50 border-indigo-400 scale-105"
                      : "bg-black/30 border-white/10 hover:bg-black/40"
                  }`}
                >
                  <div className="text-2xl mb-1">{role.emoji}</div>
                  <div className="font-bold text-sm text-white">{role.name}</div>
                  <div className="text-[10px] text-gray-400 leading-tight">{role.description}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-indigo-300 text-center bg-indigo-900/20 py-1 px-2 rounded-lg border border-indigo-500/20">
              ⚡ {getRole(roleId)?.ability}
            </p>
          </div>

          {/* Avatar Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Avatar</label>
            <div className="flex gap-2 items-center">
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Link Custom GIF/Image (Opsional)"
                className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 text-sm flex-1"
              />
              {avatarUrl ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-black/50">
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="flex -space-x-2 opacity-50">
                  {KNIGHT_AVATARS.slice(0, 3).map((a) => (
                     <img key={a.id} src={a.image} className="w-8 h-8 rounded-full border border-black bg-black/30" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Theme Select */}
          <div className="space-y-2 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-3 rounded-xl border border-purple-500/20">
            <label className="block text-sm font-medium text-purple-300">
              ✨ Tema Tantangan (AI)
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full bg-black/40 border border-purple-500/20 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/40 appearance-none cursor-pointer"
            >
              {THEME_PRESETS.map((t) => (
                <option key={t.value} value={t.value} className="bg-gray-900 text-white">
                  {t.label}
                </option>
              ))}
            </select>

            {/* Custom theme input */}
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
                    placeholder="Tulis tema kustom kamu..."
                    className="bg-black/30 border-purple-500/20 text-white placeholder:text-gray-500 text-sm mt-2"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {activeTheme && (
              <p className="text-[10px] text-purple-400/60">
                🎲 AI akan menjadi Game Master dan membuat tantangan dadakan!
              </p>
            )}
          </div>

          {/* Create / Join */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-700 hover:from-green-600 hover:to-emerald-800 text-white font-bold py-6 text-lg shadow-lg transform hover:scale-[1.02] transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="inline-block">✨</motion.span>
                  {activeTheme ? "Membuat tantangan..." : "Membuat room..."}
                </span>
              ) : (
                "⚔️ Buat Room Baru"
              )}
            </Button>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-gray-500">atau</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex gap-2">
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Kode Room"
                className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 uppercase"
              />
              <Button
                onClick={handleJoin}
                disabled={isLoading}
                className="min-w-[100px] bg-gradient-to-r from-blue-500 to-indigo-700 hover:from-blue-600 hover:to-indigo-800 text-white font-bold"
              >
                {isLoading ? "..." : "Gabung"}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
