// ============================
// Game Constants
// ============================

/** Max players per room */
export const MAX_PLAYERS = 4;

/** Avatar assignment order */
export const AVATAR_ORDER = ["knight-red", "knight-blue", "knight-green", "knight-gold"];

/** Snake & Ladder portal mappings: cell → destination */
export const SNAKES_LADDERS: Record<number, number> = {
  // Ladders (go up)
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  // Snakes (go down)
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};

/** Cells where a challenge is triggered (50 out of 100, avoiding portal cells) */
export const CHALLENGE_CELLS = new Set([
  2, 5, 8, 10, 12, 14, 15, 18, 21, 22,
  24, 25, 27, 29, 30, 33, 35, 36, 39, 40,
  42, 45, 48, 50, 51, 52, 55, 57, 58, 60,
  63, 65, 66, 69, 70, 72, 75, 76, 79, 80,
  81, 82, 85, 88, 90, 91, 92, 95, 96, 98
]);

/** Default challenges used when AI is not configured */
export const DEFAULT_CHALLENGES = [
  "Tirukan suara hewan (kambing, ayam, atau kucing meong) selama 1 putaran setiap kali giliranmu selesai.",
  "Pilih satu kontak acak di HP, telepon dia dan cuma bilang 'Aku Rindu' lalu tutup teleponnya.",
  "Joget ala cacing kepanasan selama 20 detik di tengah ruangan.",
  "Makan camilan atau minum tanpa menggunakan tangan.",
  "Berpose ala model cover majalah paling aneh dan minta difoto, lalu jadikan status WA selama 5 menit.",
  "Ceritakan momen paling memalukan (yang beneran aib) dalam hidupmu.",
  "Gombalin benda mati di dekatmu (kursi/meja) dengan penuh perasaan selama 30 detik.",
  "Ngomong pakai gaya komentator bola yang heboh banget selama 3 giliran ke depan.",
  "Tirukan gaya bicara salah satu pemain lain sampai giliranmu berikutnya.",
  "Acting adegan sinetron dramatis (nangis bombay) karena kehilangan sendal jepit kesayangan.",
  "Push up 5 kali sambil teriak 'Aku kuat, aku sehat, aku gemoy!' setiap hitungan.",
  "Nyanyikan lagu 'Balonku Ada Lima' tapi ganti semua huruf vokal jadi 'O'.",
  "Tirukan gaya jalan bebek sambil keliling ruangan satu putaran.",
  "Selfie dengan ekspresi paling jelek, kirim ke grup keluarga/teman tanpa caption.",
  "Jelaskan kenapa kamu adalah 'Manusia Paling Ganteng/Cantik Sedunia' selama 1 menit tanpa ketawa.",
];

/** Preset theme options for lobby dropdown */
export const THEME_PRESETS = [
  { value: "", label: "🎲 Tanpa Tema (Default)" },
  { value: "tantangan lucu dan memalukan", label: "😂 Tantangan Kocak" },
  { value: "dare romantis pasangan", label: "💑 Couple / Pasangan Romantis" },
  { value: "party game seru dan kocak", label: "🎉 Party Game (Nongkrong)" },
  { value: "truth or dare", label: "🔥 Truth or Dare" },
  { value: "horror spooky menakutkan", label: "👻 Horror & Misteri" },
  { value: "kids family anak-anak friendly", label: "👶 Kids & Family (Aman untuk Anak)" },
  { value: "office work kantor kerja", label: "💼 Office / Kantor (Relate Kerja)" },
  { value: "custom", label: "✏️ Custom (Tulis Sendiri)" },
];

/** Random player names for auto-generation */
const RANDOM_NAMES = [
  "Sir Lancelot", "Lady Aurora", "Baron Kopi", "Ratu Senja",
  "Pangeran Tidur", "Ksatria Malam", "Putri Bintang", "Raja Gabut",
  "Nona Boba", "Tuan Kepo", "Kapten Rebahan", "Sang Penjelajah",
  "Si Pemberani", "Jenderal Receh", "Panglima Ngemil", "Dewi Mager",
];

/** Pick a random player name */
export function getRandomName(): string {
  return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
}

/** Treasure card definitions */
export const TREASURE_CARDS = [
  { id: 'curse_back', name: 'Kutukan Mundur', emoji: '💀', description: 'Kirim musuh mundur 5 langkah!', effectType: 'curse_back' as const, targetType: 'other' as const },
  { id: 'skip_target', name: 'Lewati Giliran', emoji: '⏭️', description: 'Buat pemain lain skip 1 giliran!', effectType: 'skip_target' as const, targetType: 'other' as const },
  { id: 'double_dice', name: 'Dadu Ganda', emoji: '🎲', description: 'Roll berikutnya dikalikan 2!', effectType: 'double_dice' as const, targetType: 'self' as const },
  { id: 'teleport', name: 'Teleportasi', emoji: '🌀', description: 'Maju 10 langkah ke depan!', effectType: 'teleport' as const, targetType: 'self' as const },
  { id: 'shield', name: 'Perisai', emoji: '🛡️', description: 'Blok ular atau penalti berikutnya!', effectType: 'shield' as const, targetType: 'self' as const },
  { id: 'steal_card', name: 'Pencuri Kartu', emoji: '🦊', description: 'Curi kartu random dari pemain lain!', effectType: 'steal_card' as const, targetType: 'other' as const },
  { id: 'swap_position', name: 'Tukar Posisi', emoji: '🔄', description: 'Tukar posisi dengan pemain lain!', effectType: 'swap_position' as const, targetType: 'other' as const },
  { id: 'extra_turn', name: 'Bonus Giliran', emoji: '⚡', description: 'Dapat giliran ekstra!', effectType: 'extra_turn' as const, targetType: 'self' as const },
];

/** Cells where treasure chests appear (~15 cells, non-overlapping with challenges/portals) */
export const TREASURE_CELLS = new Set([
  3, 7, 11, 16, 23, 32, 37, 43, 47, 53, 59, 67, 73, 83, 89
]);
