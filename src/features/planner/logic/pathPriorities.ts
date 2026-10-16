import type { ClassPreset } from "@config/classPresets"
import type { BoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import { STAT_TYPES, type StatType } from "@config/stats/stats"
import { STAT_TIERS, statWeights } from "@planner/config/stats"
import type { StatSettings } from "@planner/storage/statPriorities"
import { boardWants } from "./boardWants"

// One stat's Stat focus, for Find a good path on one board.
export type PathFocusGroup = {
    // The stat's nodes.
    wanted: string[]
    // Stat nodes that aren't a detour: those of every focused stat.
    free: string[]
    // Preferred nodes not on the route yet; branches lean toward them.
    waiting: string[]
    // Most points spent on other nodes to reach one of its nodes.
    detour: number
}

// What Find a good path prefers on one board.
export type PathPriorities = {
    // "row,col" -> weight. Among routes of equal cost, the heavier wins.
    weights: [string, number][]
    // Stats to grow the route with, best tier first; empty when off.
    focusGroups: PathFocusGroup[]
}

export const pathPriorities = ({
    classPreset,
    layoutName,
    preferred,
    statSettings,
}: {
    classPreset: ClassPreset
    layoutName: BoardId
    // Ids of the skills, passives and special bonuses marked Prefer.
    preferred: ReadonlySet<string>
    statSettings: StatSettings
}): PathPriorities => {
    const layout = layouts[layoutName]
    const preferredKeys = boardWants(classPreset, layoutName)
        .filter((want) => preferred.has(want.id))
        .flatMap((want) => want.keys)

    // A preferred node outweighs every stat node together, so stats only
    // decide what the preferred nodes leave tied.
    const stats = statWeights(layout.nodeStats, statSettings.tiers)
    let statTotal = 0
    for (const weight of stats.values()) {
        statTotal += weight
    }
    const weights = new Map(stats)
    for (const key of preferredKeys) {
        weights.set(key, statTotal + 1)
    }

    // Stats with a detour, best tier first. Any of their nodes on the way
    // isn't a detour.
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
        // The setting counts the stat node's own point.
        detour: detourOf(stat) - 1,
    }))

    return {
        weights: [...weights.entries()],
        focusGroups: focusGroups,
    }
}
