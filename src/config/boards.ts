// Azphel (PvP) is planned on its own board only, never from All boards.
export const BOARD_IDS = [
    "nezekan",
    "zikel",
    "vaizel",
    "triniel",
    "ariel",
    "azphel",
] as const

export type BoardId = (typeof BOARD_IDS)[number]

export const MAIN_BOARD_IDS = [
    "nezekan",
    "zikel",
    "vaizel",
    "triniel",
] as const satisfies readonly BoardId[]

export type MainBoardId = (typeof MAIN_BOARD_IDS)[number]

// Ariel has only stat nodes and its own points (Daevanion Crystal: Ariel).
export const ARIEL_BOARD_ID = "ariel" satisfies BoardId

// Boards of stat nodes only, each with its own points and stat tiers:
// Ariel, and Azphel (Daevanion Crystal: Azphel) with PvP stats.
export type StatBoardId = Exclude<BoardId, MainBoardId>

// What All boards plans and checks: the main boards and Ariel.
export const ALL_BOARDS_IDS = [
    ...MAIN_BOARD_IDS,
    ARIEL_BOARD_ID,
] as const satisfies readonly BoardId[]

export const BOARD_NAMES: Record<BoardId, string> = {
    nezekan: "Nezekan",
    zikel: "Zikel",
    vaizel: "Vaizel",
    triniel: "Triniel",
    ariel: "Ariel",
    azphel: "Azphel",
}

export const isBoardId = (board: string): board is BoardId => {
    return Object.hasOwn(BOARD_NAMES, board)
}

export const isMainBoard = (board: BoardId): board is MainBoardId => {
    return (MAIN_BOARD_IDS as readonly BoardId[]).includes(board)
}

export const isStatBoard = (board: BoardId): board is StatBoardId => {
    return !isMainBoard(board)
}

export const isAllBoardsBoard = (board: BoardId) => {
    return (ALL_BOARDS_IDS as readonly BoardId[]).includes(board)
}

export const DEFAULT_BOARD_ID: BoardId = "nezekan"
