import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeneratedContent, GameState } from "../types";
import { DEFAULT_CHALLENGES } from "../constants";
import { buildChallengePrompt } from "./prompts";

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

    const prompt = buildChallengePrompt(gameState, activePlayerId, theme);

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
