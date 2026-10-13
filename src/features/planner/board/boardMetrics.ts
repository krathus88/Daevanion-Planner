// Cell geometry in px. A cell is 3.5rem with a 0.625rem (gap="2.5") gap.
export const CELL_SIZE = 56
const CELL_GAP = 10
export const CELL_PITCH = CELL_SIZE + CELL_GAP

export const gridExtent = (cells: number) => {
    return cells * CELL_SIZE + (cells - 1) * CELL_GAP
}
