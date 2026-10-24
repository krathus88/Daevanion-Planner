import type { ClassPreset } from "@config/classPresets"
import type { MainBoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import { STAT_TYPES, type StatType } from "@config/stats/stats"
import { STAT_TIERS, statWeights } from "@planner/config/stats"
import type { StatSettings } from "@planner/storage/statPriorities"
import { boardWants } from "./boardWants"

export type PathFocusGroup = {
    wanted: string[]
    free: string[]
    waiting: string[]
    detour: number
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
    const stats = statWeights(layout.nodeStats, statSettings.tiers)
    let statTotal = 0
    for (const weight of stats.values()) {
        statTotal += weight
    }
    const weights = new Map(stats)
    for (const key of preferredKeys) {
        weights.set(key, statTotal + 1)
    }

    const focus = statSettings.focus
    const detourOf = (stat: StatType) => focus.stats[stat].detour
    const focusStats = !focus.enabled
        ? []
        : STAT_TYPES.filter((stat) => detourOf(stat) > 0).sort(
              (left, right) =>
                  STAT_TIERS.indexOf(statSettings.tiers[left]) -
                  STAT_TIERS.indexOf(statSettings.tiers[right]),
          )
    const statKeys = Object.keys(layout.nodeStats)
    const free = statKeys.filter((key) =>
        focusStats.includes(layout.nodeStats[key]),
    )
    const focusGroups = focusStats.map((stat) => ({
        wanted: statKeys.filter((key) => layout.nodeStats[key] === stat),
        free: free,
        waiting: preferredKeys,
        // Counts the stat node's own point.
        detour: detourOf(stat) - 1,
    }))

    return {
        weights: [...weights.entries()],
        focusGroups: focusGroups,
    }
}
