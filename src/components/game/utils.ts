export function getCellPosition(cellNum: number) {
    const rowIndex = Math.floor((cellNum - 1) / 10);
    const rowFromTop = 9 - rowIndex;
    const colIndex = (rowIndex % 2 === 0)
        ? (cellNum - 1) % 10
        : 9 - ((cellNum - 1) % 10);
    return { rowFromTop, colIndex };
}
