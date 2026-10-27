import type { ClassAbility } from "@config/classPresets"
import { BOARD_STAT_NAMES, type BoardStat } from "@config/stats/stats"
import type { BoardLayout } from "@planner/config/layouts"
import {
    SPECIAL_BONUSES,
    type SpecialBonusType,
} from "@planner/config/specialNodes"

// A node's own name: its ability, stat or special bonus.
export const getNodeName = (
    ability: ClassAbility | undefined,
    stat: BoardStat | undefined,
    specialBonus: SpecialBonusType | undefined,
) => {
    return (
        ability?.name ??
        (stat && BOARD_STAT_NAMES[stat]) ??
        (specialBonus && SPECIAL_BONUSES[specialBonus].name)
    )
}

// The name of the node at a "row,column" key, falling back to its type.
const getNodeNameAt = (
    layout: BoardLayout,
    abilitiesByPosition: Readonly<Record<string, ClassAbility>>,
    key: string,
) => {
    const [row, column] = key.split(",").map(Number)
    const kind = layout.grid[row][column]
    const appearance = layout.specialNodes[kind] ?? layout.mainNode

    return (
        getNodeName(
            abilitiesByPosition[key],
            layout.nodeStats[key],
            layout.specialNodeBonuses[key],
        ) ?? appearance.name
    )
}

// Node names in first-seen order, repeats counted: "Attack ×3".
export const countNodeNames = (
    layout: BoardLayout,
    abilitiesByPosition: Readonly<Record<string, ClassAbility>>,
    keys: readonly string[],
) => {
    const counts = new Map<string, number>()

    for (const key of keys) {
        const name = getNodeNameAt(layout, abilitiesByPosition, key)

        counts.set(name, (counts.get(name) ?? 0) + 1)
    }

    const names: string[] = []

    for (const [name, count] of counts) {
        names.push(count > 1 ? `${name} ×${count}` : name)
    }

    return names
}
