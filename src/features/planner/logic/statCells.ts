import {
    isStatBoardNode,
    STAT_BOARD_NODE_GIVES,
    type StatBoardStat,
    type StatType,
} from "@config/stats/stats"
import type { BoardLayout } from "@planner/config/layouts"
import type { SpecialBonusType } from "@planner/config/specialNodes"

// A stat from a priority list (main board, Ariel or Azphel), or a main board
// special node's bonus. Their ids never overlap.
export type HighlightedStat = StatType | StatBoardStat | SpecialBonusType

// The cells that give `stat`: on Ariel and Azphel a combined node gives both
// of its stats, so it counts for each.
export const statCells = (layout: BoardLayout, stat: HighlightedStat) => {
    const cells = new Set<string>()
    for (const [key, bonus] of Object.entries(layout.specialNodeBonuses)) {
        if (bonus === stat) {
            cells.add(key)
        }
    }

    for (const [key, node] of Object.entries(layout.nodeStats)) {
        const gives = isStatBoardNode(node)
            ? (STAT_BOARD_NODE_GIVES[node] as readonly string[]).includes(stat)
            : node === stat
        if (gives) {
            cells.add(key)
        }
    }

    return cells
}
