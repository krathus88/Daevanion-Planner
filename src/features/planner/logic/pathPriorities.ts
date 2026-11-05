import type { ClassPreset } from "@config/classPresets"
import type { MainBoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import { statWeights } from "@planner/config/stats"
import type { StatSettings } from "@planner/storage/statPriorities"
import { boardWants } from "./boardWants"
import { maxedStats, statValues } from "./statOrder"

// Every wanted node is taken; free nodes don't count as detour.
export type PathFocusGroup = {
    wanted: string[]
    free: string[]
    waiting: string[]
}

export type PathPriorities = {
    weights: [string, number][]
    focusGroups: PathFocusGroup[]
}

export const pathPriorities = ({
    classPreset,
    layoutName,
    preferred,
    statSettings,
}: {
    classPreset: ClassPreset
    layoutName: MainBoardId
    preferred: ReadonlySet<string>
    statSettings: StatSettings
}): PathPriorities => {
    const layout = layouts[layoutName]
    const preferredKeys = boardWants(classPreset, layoutName)
        .filter((want) => preferred.has(want.id))
        .flatMap((want) => want.keys)

    // Outweighs every stat node together, so stats only break remaining ties.
    const stats = statWeights(layout.nodeStats, statValues(statSettings))
    let statTotal = 0
    for (const weight of stats.values()) {
        statTotal += weight
    }
    const weights = new Map(stats)
    for (const key of preferredKeys) {
        weights.set(key, statTotal + 1)
    }

    // Maxed stats take every node on the board, best stat first.
    const maxed = maxedStats(statSettings)
    const statKeys = Object.keys(layout.nodeStats)
    const free = statKeys.filter((key) => maxed.includes(layout.nodeStats[key]))
    const focusGroups = maxed.map((stat) => ({
        wanted: statKeys.filter((key) => layout.nodeStats[key] === stat),
        free: free,
        waiting: preferredKeys,
    }))

    return {
        weights: [...weights.entries()],
        focusGroups: focusGroups,
    }
}
