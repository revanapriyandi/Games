import { Button } from "../ui/button";
import type { GameState } from "../../lib/types";

interface GameHeaderProps {
    roomId: string;
    onLeave: () => void;
    aiConfig?: GameState["aiConfig"];
}

export function GameHeader({ roomId, onLeave, aiConfig }: GameHeaderProps) {
    return (
        <>
            <div className="fixed top-2 right-2 z-50 flex flex-col items-end gap-1">
                <h1 className="text-[10px] md:text-xs text-white/30 font-mono select-none">ROOM: {roomId}</h1>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLeave}
                    className="h-6 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                    Keluar
                </Button>
            </div>

            {/* Theme badge */}
            {aiConfig && (
                <div className="fixed top-1 left-2 z-20 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] text-purple-300 font-medium">
                    ✨ {aiConfig.theme}
                </div>
            )}
        </>
    );
}
