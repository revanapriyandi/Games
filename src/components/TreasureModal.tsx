// ============================
// Treasure Discovery Modal
// ============================

import { motion, AnimatePresence } from "framer-motion";
import type { TreasureCard } from "../lib/types";

interface TreasureModalProps {
  isOpen: boolean;
  card: TreasureCard;
  isActivePlayer: boolean;
  playerName?: string;
  onDismiss: () => void;
}

export default function TreasureModal({ isOpen, card, isActivePlayer, playerName, onDismiss }: TreasureModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          {/* Sparkle particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl pointer-events-none"
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: 0,
                y: 0 
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.5, 0],
                x: Math.cos(i * 30 * Math.PI / 180) * 150,
                y: Math.sin(i * 30 * Math.PI / 180) * 150,
              }}
              transition={{ duration: 1.5, delay: 0.2 + i * 0.08, ease: "easeOut" }}
            >
              ✨
            </motion.div>
          ))}

          <motion.div
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="relative bg-gradient-to-b from-amber-900/95 to-yellow-900/95 border-2 border-yellow-500/60 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl shadow-yellow-500/20"
          >
            {/* Chest icon */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-6xl mb-2"
            >
              📦
            </motion.div>

            <h2 className="text-yellow-300 text-xl font-bold mb-1">
              Harta Karun Ditemukan!
            </h2>
            <p className="text-yellow-100/70 text-sm mb-4">
              {isActivePlayer ? "Kamu" : playerName} menemukan kartu ajaib!
            </p>

            {/* Card Display */}
            <motion.div
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", damping: 15 }}
              className="bg-gradient-to-br from-yellow-700/50 to-amber-800/50 border border-yellow-500/40 rounded-xl p-4 mb-4"
            >
              <div className="text-5xl mb-2">{card.emoji}</div>
              <h3 className="text-yellow-200 text-lg font-bold mb-1">{card.name}</h3>
              <p className="text-yellow-100/80 text-sm">{card.description}</p>
              <div className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-600/30 text-yellow-300">
                {card.targetType === 'self' ? '🎯 Self' : '👥 Target Pemain Lain'}
              </div>
            </motion.div>

            {isActivePlayer ? (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={onDismiss}
                className="w-full py-3 px-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold rounded-xl transition-all shadow-lg cursor-pointer"
              >
                💎 Simpan ke Inventori
              </motion.button>
            ) : (
              <p className="text-yellow-300/60 text-sm italic">
                Menunggu {playerName} menyimpan kartu...
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
