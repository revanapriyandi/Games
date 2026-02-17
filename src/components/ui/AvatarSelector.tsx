import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Dices, ChevronRight } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { getAvatarUrl, getRandomSeed, AVATAR_STYLES, type AvatarStyle } from "../../lib/avatar";

interface AvatarSelectorProps {
  onSelect: (url: string) => void;
  initialAvatar?: string;
}

export function AvatarSelector({ onSelect, initialAvatar }: AvatarSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>("adventurer");

  // Initialize seeds lazily to avoid useEffect on mount
  const [seeds, setSeeds] = useState<string[]>(() => Array(6).fill(0).map(() => getRandomSeed()));
  const [isRandomizing, setIsRandomizing] = useState(false);

  const generateRandomSeeds = () => {
    setIsRandomizing(true);
    const newSeeds = Array(6).fill(0).map(() => getRandomSeed());
    setSeeds(newSeeds);
    setTimeout(() => setIsRandomizing(false), 500);
  };

  const handleSearchChange = (val: string) => {
      setSearchQuery(val);
      if (val) {
        // If searching, generate variations of the query
        const newSeeds = [
            val,
            `${val}-1`,
            `${val}-2`,
            `${val}-x`,
            `${val}-super`,
            `${val}-99`,
        ];
        setSeeds(newSeeds);
      } else {
        // If query is cleared, revert to random seeds
        generateRandomSeeds();
      }
  };

  const handleSelect = (seed: string) => {
    const url = getAvatarUrl(selectedStyle, seed);
    onSelect(url);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Search & Randomize Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari nama hero..."
            className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:bg-black/40 transition-colors"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={generateRandomSeeds}
          className="bg-black/20 border-white/10 hover:bg-white/10 text-white shrink-0"
          title="Acak Avatar"
        >
          <Dices className={`w-4 h-4 ${isRandomizing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Style Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
        {AVATAR_STYLES.map((style) => (
          <button
            key={style.value}
            onClick={() => setSelectedStyle(style.value)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border
              ${selectedStyle === style.value
                ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                : "bg-black/20 border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-300"}
            `}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <AnimatePresence mode="popLayout">
          {seeds.map((seed, i) => {
            const url = getAvatarUrl(selectedStyle, seed);
            const isSelected = initialAvatar === url;

            return (
              <motion.div
                key={`${selectedStyle}-${seed}`}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSelect(seed)}
                className={`
                  aspect-square rounded-xl overflow-hidden cursor-pointer relative group
                  bg-black/30 border-2 transition-all hover:scale-105 hover:shadow-lg
                  ${isSelected ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "border-transparent hover:border-white/20"}
                `}
              >
                <img
                  src={url}
                  alt={seed}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Selection Indicator */}
                <div className={`
                  absolute inset-0 bg-indigo-500/20 transition-opacity flex items-center justify-center pointer-events-none
                  ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                `}>
                  {isSelected && (
                    <div className="bg-indigo-600 rounded-full p-1 shadow-lg">
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
