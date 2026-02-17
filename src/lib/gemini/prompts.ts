import type { GameState } from "../types";

export function buildChallengePrompt(gameState: GameState, activePlayerId: string, theme: string): string {
  const activePlayer = gameState.players[activePlayerId];
  const otherPlayers = Object.values(gameState.players).filter(p => p.id !== activePlayerId);

  // Construct context for the AI
  const context = {
    theme: theme || "General Fun",
    activePlayer: { name: activePlayer.name, position: activePlayer.position },
    others: otherPlayers.map(p => ({ name: p.name, position: p.position })),
    leading: Object.values(gameState.players).sort((a, b) => (b.position || 0) - (a.position || 0))[0].name
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
- Apakah ${activePlayer.name} sedang memimpin? ${activePlayer.name === context.leading ? "YA" : "TIDAK"
    }

🕹️ ATURAN UTAMA:
- Output hanya boleh berisi tantangan, tanpa pembukaan atau penjelasan tambahan.
- ⚠️ PAHAMI TEMA '${context.theme}' DAN JANGAN BERIKAN TANTANGAN YANG TIDAK SESUAI.
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
- ⚠️ INTERUPSI PENTING: Tantangan HARUS 100% RELATE dengan tema '${theme}'.
- JANGAN berikan tantangan generic/umum (seperti "nyanyi", "joget", "jujur") KECUALI dimodifikasi agar sesuai tema ini.
- Tolak semua tantangan yang melenceng dari topik '${theme}'.
- Gunakan vocabulary, istilah, dan jokes yang spesifik untuk dunia '${theme}'.

Contoh Salah (Tema: Masak):
"Nyanyikan lagu Potong Bebek Angsa." (❌ Tidak ada hubungannya dengan masak)

Contoh Benar (Tema: Masak):
"Peragakan gaya Chef Juna saat memarahi kontestan karena makanannya kurang garam!" (✅ Sesuai tema)

Jika tema '${theme}' adalah karakter/film/game spesifik, wujudkan roleplay yang mendalam.
`;
  }
  return prompt;
}
