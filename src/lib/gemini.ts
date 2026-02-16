// ============================
// Gemini AI API Client
// ============================

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeneratedContent, GameState } from "./types";
import { DEFAULT_CHALLENGES } from "./constants";

/** Get configured API key */
function getApiKey(): string | undefined {
  return import.meta.env.VITE_GEMINI_API_KEY;
}

/**
 * Generate a SINGLE challenge based on the current game context.
 * This is called when a player lands on a challenge cell.
 */
export async function generateSingleChallenge(
  gameState: GameState, 
  activePlayerId: string, 
  theme: string
): Promise<{ text: string, penalty: { type: 'steps' | 'skip_turn', value: number } }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      text: DEFAULT_CHALLENGES[Math.floor(Math.random() * DEFAULT_CHALLENGES.length)],
      penalty: { type: 'steps', value: 3 }
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "text/plain", // Just want raw text
      }
    });

    const activePlayer = gameState.players[activePlayerId];
    const otherPlayers = Object.values(gameState.players).filter(p => p.id !== activePlayerId);
    
    // Construct context for the AI
    const context = {
      theme: theme || "General Fun",
      activePlayer: { name: activePlayer.name, position: activePlayer.position },
      others: otherPlayers.map(p => ({ name: p.name, position: p.position })),
      leading: Object.values(gameState.players).sort((a,b) => b.position - a.position)[0].name
    };

    const lowerTheme = theme.toLowerCase();
    const isCouple = /couple|pasangan|romantis|date/i.test(lowerTheme);
    const isKids = /kid|anak|bocil|keluarga|family/i.test(lowerTheme);
    const isHorror = /horror|hantu|seram|spooky|misteri/i.test(lowerTheme);
    const isParty = /party|nongkrong|teman|sahabat|gila/i.test(lowerTheme);
    const isOffice = /office|kerja|kantor|bos/i.test(lowerTheme);
    const isAdult = /17\+|dewasa|hot|spicy/i.test(lowerTheme);
    const isFunny = /lucu|kocak|memalukan|komedi|lawak/i.test(lowerTheme);
    
   let prompt = `
Kamu adalah Game Master untuk permainan Snakes & Ladders versi Truth or Dare.

📌 KONTEKS PEMAIN:
${JSON.stringify(context)}

🎯 MISI:
Buat SATU tantangan seru, kreatif, dan detail untuk pemain berikut:

- Nama: ${activePlayer.name}
- Posisi saat ini: ${activePlayer.position}
- Pemimpin permainan: ${context.leading}
- Apakah ${activePlayer.name} sedang memimpin? ${
  activePlayer.name === context.leading ? "YA" : "TIDAK"
}

🕹️ ATURAN UTAMA:
- Output hanya boleh berisi tantangan, tanpa pembukaan atau penjelasan tambahan.
- Gunakan bahasa Indonesia yang hidup, fun, sedikit spicy, dan tidak kaku.
- Tantangan boleh Truth atau Dare, tapi harus terasa seperti game party.
- Panjang ideal: 1–2 kalimat (jangan terlalu pendek atau terlalu panjang).
- Jika pemain sedang memimpin, tantangan harus sedikit lebih berat.
- Tidak boleh ada tantangan yang sama lebih dari 1 kali.
- Tidak boleh memberi perintah untuk menyakiti diri sendiri atau orang lain.
- Tidak boleh memberi perintah ke pemain lain.

🔥 LOGIKA PERMAINAN:
- Sebut pemain lain jika bisa bikin situasi makin seru dan interaktif.

⚠️ WAJIB TAMBAHKAN PENALTI DI AKHIR:
Tambahkan salah satu tag berikut:

- ||PENALTY:STEPS:X||  → mundur 1–6 langkah  
  (Semakin mudah tantangan, semakin besar X)

- ||PENALTY:SKIP:1||   → skip 1 giliran  
  (Hanya untuk tantangan super berat)

Contoh output:
"Nyanyikan lagu 'Balonku' tapi semua vokalnya diganti huruf O! ||PENALTY:STEPS:3||"
`;

if (isCouple) {
  prompt += `
💘 MODE COUPLE (ROMANTIS):
- Fokus pada chemistry, momen manis, flirty, kiss, dan pertanyaan yang bikin baper.
- Harus cocok untuk date night, bukan tantangan generic.
- Buat terasa spicy tapi tetap sweet.
- Boleh tantangan truth atau dare.
`;
} else if (isAdult) {
  prompt += `
🔥 MODE ADULT (17+):
- Tantangan lebih berani, intens, sedikit edgy tapi tetap aman dan legal.
- Bisa flirty, truth yang revealing, atau dare yang bikin deg-degan.

Contoh vibe:
"Bisikkan rahasia paling nakal yang pernah kamu pikirkan (boleh sensor dikit)."
`;
} else if (isFunny) {
  prompt += `
😂 MODE FUNNY/KOCAK:
- Fokus pada humor total, aksi memalukan yang harmless, dan bikin semua ngakak.
- Gunakan gaya lebay atau alay kalau makin lucu.

Contoh vibe:
"Peragakan ibu-ibu komplek lagi gosip harga cabai sampai semua orang ketawa."
`;
} else if (isKids) {
  prompt += `
🧒 MODE KIDS/FAMILY:
- HARUS aman untuk anak-anak (tanpa romance, tanpa hal dewasa, tanpa horor ekstrem).
- Fokus pada gerakan lucu, edukasi ringan, dan vibe positif.

Contoh vibe:
"Tirukan suara hewan favoritmu dan suruh semua orang tebak!"
`;
} else if (isHorror) {
  prompt += `
👻 MODE HORROR:
- Buat suasana creepy tapi tetap fun.
- Tantangan seputar cerita seram, keberanian, atau aksi menegangkan.

Contoh vibe:
"Ceritakan pengalaman horor paling menyeramkan dengan suara berbisik."
`;
} else if (isParty) {
  prompt += `
🎉 MODE PARTY/HANGOUT:
- Energi harus rame, heboh, social dares, dan cocok buat nongkrong.
- Boleh sedikit embarrassing tapi tetap fun.

Contoh vibe:
"Joget TikTok tanpa musik sampai semua orang teriak STOP!"
`;
} else if (isOffice) {
  prompt += `
💼 MODE OFFICE/WORK:
- Tantangan bertema kantor, meeting, bos, email, burnout tapi lucu.
- Tetap profesional-ish tapi satir.

Contoh vibe:
"Peragakan gaya bosmu saat marah karena deadline molor."
`;
} else {
  prompt += `
✨ MODE CUSTOM THEME: '${theme}'
- Tantangan HARUS sesuai tema ini secara spesifik.
- Semakin kreatif, semakin bagus.

Jika tema 'Superhero', tantangan harus soal kekuatan/pahlawan.
Jika tema 'Cooking', tantangan harus soal masak/chef.

Contoh untuk leader:
"Karena kamu sedang memimpin, ${activePlayer.name} wajib catwalk seperti raja dunia sambil memuji diri sendiri. Kalau ketawa atau gagal sombong, mundur 3 langkah!"
`;
}

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Parse penalty tag
    let penalty: { type: 'steps' | 'skip_turn', value: number } = { type: 'steps', value: 3 }; // Default
    let cleanText = text;

    const stepsMatch = text.match(/\|\|PENALTY:STEPS:(\d+)\|\|/);
    const skipMatch = text.match(/\|\|PENALTY:SKIP:(\d+)\|\|/);

    if (skipMatch) {
       penalty = { type: 'skip_turn', value: parseInt(skipMatch[1]) };
       cleanText = text.replace(/\|\|PENALTY:SKIP:\d+\|\|/, '').trim();
    } else if (stepsMatch) {
       penalty = { type: 'steps', value: parseInt(stepsMatch[1]) };
       cleanText = text.replace(/\|\|PENALTY:STEPS:\d+\|\|/, '').trim();
    }

    return { text: cleanText || DEFAULT_CHALLENGES[0], penalty };

  } catch (error) {
    console.error("[Gemini] Single generation failed:", error);
    return {
       text: DEFAULT_CHALLENGES[Math.floor(Math.random() * DEFAULT_CHALLENGES.length)],
       penalty: { type: 'steps', value: 3 }
    };
  }
}

/**
 * Generate game metadata (Hero titles, Flavor text).
 * Challenges are now generated on-the-fly, so we don't pre-generate them here.
 */
export async function generateGameContent(themePrompt: string): Promise<GeneratedContent> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[Gemini] No API key. Using defaults.");
    return getDefaultContent();
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are a game designer for a Snakes & Ladders party game.
Theme: "${themePrompt}"

Generate a JSON object with this schema:
{
  "heroTitles": string[], // Exactly 4 cool hero titles in Indonesian.
  "flavorText": string // Short description of the theme in Indonesian.
}

Rules:
- ALL OUTPUT MUST BE VALID JSON.
- Language: INDONESIAN.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) throw new Error("Empty Gemini response");

    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed.heroTitles) || parsed.heroTitles.length < 4) {
      throw new Error("Invalid hero titles");
    }

    return {
      challenges: [], // Empty, as we generate them on the fly
      heroTitles: parsed.heroTitles.slice(0, 4),
      flavorText: parsed.flavorText || themePrompt,
    };
  } catch (error) {
    console.error("[Gemini] Generation failed:", error);
    return getDefaultContent();
  }
}

function getDefaultContent(): GeneratedContent {
  return {
    challenges: [...DEFAULT_CHALLENGES],
    heroTitles: ["Ksatria Merah", "Ksatria Biru", "Ksatria Hijau", "Ksatria Emas"],
    flavorText: "Petualangan klasik Ular Tangga!",
  };
}
