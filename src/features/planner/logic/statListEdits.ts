import type { StatType } from "@config/stats/stats"
import type { StatMax, StatSettings } from "@planner/storage/statPriorities"
import { statGroups } from "./statOrder"

// Where a dragged stat lands: into a rank (worth the same as the stats
// there), into the gap before rank `index` (a new rank), or Ignored.
export type StatDrop =
    | { kind: "rank"; index: number }
    | { kind: "gap"; index: number }
    | { kind: "ignored" }

const fromGroups = (groups: readonly StatType[][]) => {
    const order: StatType[] = []
    const tied: StatType[] = []
    for (const group of groups) {
        group.forEach((stat, index) => {
            order.push(stat)
            if (index > 0) {
                tied.push(stat)
            }
        })
    }

    return { order: order, tied: tied }
}

// Indexes count the ranks as they were before the move; a rank left empty
// is dropped.
export const dropStat = (
    settings: StatSettings,
    stat: StatType,
    drop: StatDrop,
): StatSettings => {
    const groups = statGroups(settings).map((group) => {
        return group.filter((other) => other !== stat)
    })
    const ignored = settings.ignored.filter((other) => other !== stat)

    if (drop.kind === "rank") {
        if (!groups[drop.index]) {
            return settings
        }

        groups[drop.index].push(stat)
    } else if (drop.kind === "gap") {
        groups.splice(drop.index, 0, [stat])
    } else {
        ignored.push(stat)
    }

    const isIgnored = ignored.includes(stat)
    return {
        ...settings,
        ...fromGroups(groups.filter((group) => group.length > 0)),
        ignored: ignored,
        // An ignored stat is never maxed.
        max: isIgnored
            ? {
                  ...settings.max,
                  [stat]: { ...settings.max[stat], enabled: false },
              }
            : settings.max,
    }
}

export const setStatMax = (
    settings: StatSettings,
    stat: StatType,
    max: StatMax,
): StatSettings => {
    return { ...settings, max: { ...settings.max, [stat]: max } }
}
