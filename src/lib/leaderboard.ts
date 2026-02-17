import { firestore } from "./firebase";
import { collection, doc, getDoc, setDoc, updateDoc, increment, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import type { Player } from "./types";

export interface LeaderboardEntry {
    name: string;
    avatar: string;
    wins: number;
    gamesPlayed: number;
    lastPlayed: Timestamp;
}

const COLLECTION_NAME = "leaderboard";

/**
 * Updates the leaderboard for the winner.
 * Since we don't have persistent user IDs, we'll use the player name as the key.
 */
export async function updateLeaderboard(winner: Player) {
    if (!winner || !winner.name) return;

    const normalizedName = winner.name.trim();
    const docId = normalizedName.toLowerCase().replace(/[^a-z0-9]/g, "_"); // Simple sanitization
    const playerRef = doc(firestore, COLLECTION_NAME, docId);

    try {
        const docSnap = await getDoc(playerRef);

        if (docSnap.exists()) {
            await updateDoc(playerRef, {
                wins: increment(1),
                gamesPlayed: increment(1),
                lastPlayed: Timestamp.now(),
                // Update avatar to the latest one used
                avatar: winner.customAvatarUrl || winner.avatar
            });
        } else {
            const newEntry: LeaderboardEntry = {
                name: normalizedName,
                avatar: winner.customAvatarUrl || winner.avatar,
                wins: 1,
                gamesPlayed: 1,
                lastPlayed: Timestamp.now()
            };
            await setDoc(playerRef, newEntry);
        }
    } catch (error) {
        console.error("Error updating leaderboard:", error);
    }
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
        const q = query(
            collection(firestore, COLLECTION_NAME),
            orderBy("wins", "desc"),
            limit(10)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
}
