// The Daevanion boards the planner covers. The game's fifth board is PvP
// only and left out. Each board's grid and nodes are in
// @planner/config/layouts.ts.
export const BOARD_IDS = ["nezekan", "zikel", "vaizel", "triniel"] as const

export type BoardId = (typeof BOARD_IDS)[number]

export const BOARD_NAMES: Record<BoardId, string> = {
    nezekan: "Nezekan",
    zikel: "Zikel",
    vaizel: "Vaizel",
    triniel: "Triniel",
}

export const isBoardId = (board: string): board is BoardId => {
    return Object.hasOwn(BOARD_NAMES, board)
}

export const DEFAULT_BOARD_ID: BoardId = "nezekan"
