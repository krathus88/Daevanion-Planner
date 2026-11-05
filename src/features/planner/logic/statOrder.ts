import type { StatType } from "@config/stats/stats"
import type { StatSettings } from "@planner/storage/statPriorities"

// More than the stat nodes on any one board, so one node of a better stat
// outweighs every worse node together.
const LEVEL_BASE = 256

type StatOrder = Pick<StatSettings, "order" | "tied">

// Best first; tied stats share a group.
export const statGroups = (settings: StatOrder) => {
    const groups: StatType[][] = []
    for (const stat of settings.order) {
        const last = groups.at(-1)
        if (last && settings.tied.includes(stat)) {
            last.push(stat)
        } else {
            groups.push([stat])
        }
    }

    return groups
}

// Ignored stats are left out.
export const statValues = (settings: StatOrder) => {
    const groups = statGroups(settings)
    const values: Partial<Record<StatType, number>> = {}
    let value = 1
    for (let index = groups.length - 1; index >= 0; index -= 1) {
        for (const stat of groups[index]) {
            values[stat] = value
        }
        value *= LEVEL_BASE
    }

    return values
}

// In the stats' order.
export const maxedStats = (settings: Pick<StatSettings, "order" | "max">) => {
    return settings.order.filter((stat) => settings.max[stat].enabled)
}
