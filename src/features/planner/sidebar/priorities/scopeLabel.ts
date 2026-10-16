import { BOARD_NAMES, type BoardId } from "@config/boards"

// Where the priority lists count nodes: one board, or all four.
export const scopeLabel = (layout?: BoardId) => {
    return layout ? `on ${BOARD_NAMES[layout]}` : "across all boards"
}
