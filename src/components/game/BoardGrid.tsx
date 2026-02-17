import { memo } from "react";
import { SNAKES_LADDERS } from "../../lib/game";
import { CHALLENGE_CELLS, TREASURE_CELLS, ROLE_CELLS } from "../../lib/constants";
import { BoardCell } from "./BoardCell";
import { getCellPosition } from "./utils";

interface BoardGridProps {
    portals?: Record<number, number>;
    activePortalCell: number | null;
    hidePortals?: boolean;
}

export const BoardGrid = memo(function BoardGrid({ portals, activePortalCell, hidePortals }: BoardGridProps) {
    const cells = Array.from({ length: 100 }, (_, i) => 100 - i);
    const activePortals = portals || SNAKES_LADDERS;
    
    // Only calculate lines if visible
    const portalList = hidePortals ? [] : Object.entries(activePortals).map(([from, to]) => ({
        from: Number(from),
        to: Number(to),
        isLadder: Number(to) > Number(from),
    }));

    return (
        <>
            {/* Grid */}
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 z-10">
                {cells.map((cellNum) => {
                    const { rowFromTop, colIndex } = getCellPosition(cellNum);

                    return (
                        <BoardCell
                            key={cellNum}
                            cellNum={cellNum}
                            rowFromTop={rowFromTop}
                            colIndex={colIndex}
                            portal={hidePortals ? undefined : activePortals[cellNum]}
                            isChallenge={CHALLENGE_CELLS.has(cellNum)}
                            isTreasure={TREASURE_CELLS.has(cellNum)}
                            isRole={ROLE_CELLS.has(cellNum)}
                            activePortalCell={activePortalCell}
                        />
                    );
                })}
            </div>

            {/* Portal connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-[11]" viewBox="0 0 100 100" preserveAspectRatio="none">
                {portalList.map(({ from, to, isLadder }) => {
                    const fromPos = getCellPosition(from);
                    const toPos = getCellPosition(to);
                    const x1 = fromPos.colIndex * 10 + 5;
                    const y1 = fromPos.rowFromTop * 10 + 5;
                    const x2 = toPos.colIndex * 10 + 5;
                    const y2 = toPos.rowFromTop * 10 + 5;

                    return (
                        <line
                            key={`${from}-${to}`}
                            x1={x1} y1={y1}
                            x2={x2} y2={y2}
                            stroke={isLadder ? "#60A5FA" : "#EF4444"}
                            strokeWidth="1.5"
                            strokeDasharray="4,2"
                            opacity={0.8}
                            vectorEffect="non-scaling-stroke"
                        />
                    );
                })}
            </svg>
        </>
    );
});
