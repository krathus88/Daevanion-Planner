import { BOARD_NAMES, type BoardId } from "@config/boards"

export const scopeLabel = (layout?: BoardId) => {
    return layout ? `on ${BOARD_NAMES[layout]}` : "across all boards"
}
