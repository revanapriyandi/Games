import knightRed from '../assets/knight_red.png';
import knightBlue from '../assets/knight_blue.png';
import knightGreen from '../assets/knight_green.png';
import knightGold from '../assets/knight_gold.png';

export interface KnightAvatar {
    id: string;
    name: string;
    image: string;
}

export const KNIGHT_AVATARS: KnightAvatar[] = [
    { id: "knight-red", name: "Red Knight", image: knightRed },
    { id: "knight-blue", name: "Blue Knight", image: knightBlue },
    { id: "knight-green", name: "Green Knight", image: knightGreen },
    { id: "knight-gold", name: "Gold Knight", image: knightGold },
];

const AVATAR_IMAGES = [knightRed, knightBlue, knightGreen, knightGold];

/**
 * Get avatar image by ID. If not found (legacy emoji avatars), 
 * use the playerIndex to assign a unique color.
 */
export function getAvatarImage(avatarId: string, playerIndex: number = 0): string {
    const avatar = KNIGHT_AVATARS.find(a => a.id === avatarId);
    if (avatar) return avatar.image;
    // Fallback: use player index for unique color
    return AVATAR_IMAGES[playerIndex % AVATAR_IMAGES.length];
}
