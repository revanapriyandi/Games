
export type AvatarStyle = 'adventurer' | 'adventurer-neutral' | 'bottts' | 'avataaars' | 'fun-emoji';

export const AVATAR_STYLES: { value: AvatarStyle; label: string }[] = [
  { value: 'adventurer', label: 'Knight' },
  { value: 'adventurer-neutral', label: 'Warrior' },
  { value: 'bottts', label: 'Robot' },
  { value: 'avataaars', label: 'Human' },
  { value: 'fun-emoji', label: 'Emoji' },
];

/**
 * Generates a DiceBear avatar URL based on style and seed.
 * @param style The avatar style (e.g., 'adventurer').
 * @param seed The unique seed string (e.g., user's name or search query).
 * @returns The full URL to the avatar image.
 */
export function getAvatarUrl(style: AvatarStyle, seed: string): string {
  // Use DiceBear API v9.x
  // encodeURIComponent ensures the seed is URL-safe
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Generates a random seed string.
 */
export function getRandomSeed(): string {
  return Math.random().toString(36).substring(7);
}
