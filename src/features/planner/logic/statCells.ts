import {
    ARIEL_NODE_GIVES,
    type ArielPriorityStat,
    type ArielStatType,
    type BoardStat,
    type StatType,
} from "@config/stats/stats"
import type { BoardLayout } from "@planner/config/layouts"
import type { SpecialBonusType } from "@planner/config/specialNodes"

// A stat from a priority list (main board or Ariel), or a main board special
// node's bonus. Their ids never overlap.
export type HighlightedStat = StatType | ArielPriorityStat | SpecialBonusType

const isArielNode = (node: BoardStat): node is ArielStatType => {
    return node in ARIEL_NODE_GIVES
}

// The cells that give `stat`: on Ariel a combined node gives both of its
// stats, so it counts for each.
export const statCells = (layout: BoardLayout, stat: HighlightedStat) => {
    const cells = new Set<string>()
    for (const [key, bonus] of Object.entries(layout.specialNodeBonuses)) {
        if (bonus === stat) {
            cells.add(key)
        }
    }

    for (const [key, node] of Object.entries(layout.nodeStats)) {
        const gives = isArielNode(node)
            ? (ARIEL_NODE_GIVES[node] as readonly string[]).includes(stat)
            : node === stat
        if (gives) {
            cells.add(key)
        }
    }

    return cells
}
