// The Daevanion boards the planner covers. Azphel is PvP only and left
// out. Each board's grid and nodes are in @planner/config/layouts.ts.
export const BOARD_IDS = [
    "nezekan",
    "zikel",
    "vaizel",
    "triniel",
    "ariel",
] as const

export type BoardId = (typeof BOARD_IDS)[number]

// The boards that split one shared point budget and hold the class's
// skills, passives and special nodes.
export const MAIN_BOARD_IDS = [
    "nezekan",
    "zikel",
    "vaizel",
    "triniel",
] as const satisfies readonly BoardId[]

export type MainBoardId = (typeof MAIN_BOARD_IDS)[number]

// Ariel has only stat nodes and its own points (Daevanion Crystal: Ariel).
export const ARIEL_BOARD_ID = "ariel" satisfies BoardId

export const BOARD_NAMES: Record<BoardId, string> = {
    nezekan: "Nezekan",
    zikel: "Zikel",
    vaizel: "Vaizel",
    triniel: "Triniel",
    ariel: "Ariel",
}

export const isBoardId = (board: string): board is BoardId => {
    return Object.hasOwn(BOARD_NAMES, board)
}

export const isMainBoard = (board: BoardId): board is MainBoardId => {
    return (MAIN_BOARD_IDS as readonly BoardId[]).includes(board)
}

export const DEFAULT_BOARD_ID: BoardId = "nezekan"
