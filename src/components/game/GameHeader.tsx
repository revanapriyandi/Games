import { Button } from "../ui/button";
import type { GameState } from "../../lib/types";
import { LogOut } from "lucide-react";

interface GameHeaderProps {
    roomId: string;
    onLeave: () => void;
    aiConfig?: GameState["aiConfig"];
}

export function GameHeader({ roomId, onLeave, aiConfig }: GameHeaderProps) {
    return (
        <>
            <div className="fixed top-3 left-4 md:left-8 z-[60] flex items-center gap-3">
                 <Button
                    variant="destructive"
                    size="sm"
                    onClick={onLeave}
                    className="h-8 px-3 text-xs font-bold shadow-lg border border-white/20 hover:scale-105 transition-transform bg-red-600/90 hover:bg-red-700"
                >
                    <LogOut className="w-3 h-3 mr-1.5" />
                    KELUAR
                </Button>

                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-gray-400 select-all">
                    ROOM: <span className="text-white font-bold">{roomId}</span>
                </div>
            </div>

            {/* Theme badge */}
            {aiConfig && (
                <div className="fixed top-14 left-4 md:left-8 z-20 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-xs text-purple-300 font-medium shadow-sm backdrop-blur-sm">
                    ✨ {aiConfig.theme}
                </div>
            )}
        </>
    );
}
