import {
    ARIEL_NODE_GIVES,
    ARIEL_PRIORITY_STATS,
    type ArielPriorityStat,
} from "@config/stats/stats"
import { layouts } from "@planner/config/layouts"
import {
    ARIEL_RANK_GROUPS,
    ARIEL_SAME_RANK_ORDERS,
    DEFAULT_ARIEL_RANK_ORDER,
    DEFAULT_ARIEL_STAT_TIERS,
    STAT_TIERS,
    type ArielRankGroup,
    type ArielRankOrder,
    type ArielSameRankOrder,
    type StatTier,
} from "@planner/config/stats"
import { readBoardProgress } from "./boardStorage"
import { readClassSettings, writeClassSettings } from "./classSettings"
import { isRecord } from "./isRecord"
import type { StatNodeCount } from "./statPriorities"

export type ArielSettings = {
    points: number
    // Best, Good or Okay; an ignored stat keeps its tier for when it's used
    // again (`arielTiers` gives the tiers with Ignore).
    tiers: Record<ArielPriorityStat, StatTier>
    // Clicked off by name, like an ability's Skip.
    ignored: ArielPriorityStat[]
    // Within a tier: which of the offensive/defensive special nodes and stats
    // go first (More/Equal/Less). An ignored group keeps its level for when
    // it's used again (`arielOrder` gives the order with Ignore).
    order: ArielRankOrder
    // Groups clicked off by name.
    ignoredGroups: ArielRankGroup[]
}

// Max 60: 30 each from Krao Cave and Draupnir.
const DEFAULT_ARIEL_POINTS = 0

// The tier a stat that starts ignored gets once it's used.
const usedTier = (stat: ArielPriorityStat): StatTier => {
    const tier = DEFAULT_ARIEL_STAT_TIERS[stat]
    return tier === "ignore" ? "okay" : tier
}

const DEFAULT_IGNORED = ARIEL_PRIORITY_STATS.filter((stat) => {
    return DEFAULT_ARIEL_STAT_TIERS[stat] === "ignore"
})

export const DEFAULT_ARIEL_SETTINGS: ArielSettings = {
    points: DEFAULT_ARIEL_POINTS,
    tiers: Object.fromEntries(
        ARIEL_PRIORITY_STATS.map((stat) => [stat, usedTier(stat)]),
    ) as Record<ArielPriorityStat, StatTier>,
    ignored: DEFAULT_IGNORED,
    order: DEFAULT_ARIEL_RANK_ORDER,
    ignoredGroups: [],
}

const isGroup = (value: unknown): value is ArielRankGroup => {
    return (
        typeof value === "string" &&
        (ARIEL_RANK_GROUPS as readonly string[]).includes(value)
    )
}

const isStat = (value: unknown): value is ArielPriorityStat => {
    return (
        typeof value === "string" &&
        (ARIEL_PRIORITY_STATS as readonly string[]).includes(value)
    )
}

const isTier = (value: unknown): value is StatTier => {
    return (
        typeof value === "string" &&
        (STAT_TIERS as readonly string[]).includes(value)
    )
}

const isOrder = (value: unknown): value is ArielSameRankOrder => {
    return (
        typeof value === "string" &&
        (ARIEL_SAME_RANK_ORDERS as readonly string[]).includes(value)
    )
}

const isPoints = (value: unknown): value is number => {
    return typeof value === "number" && Number.isInteger(value) && value >= 0
}

export const readArielSettings = (classId: string): ArielSettings => {
    try {
        const value = readClassSettings(classId, "ariel")
        if (value === undefined) {
            return DEFAULT_ARIEL_SETTINGS
        }

        if (!isRecord(value)) {
            throw new Error("Saved Ariel settings are invalid.")
        }

        // Older saves also ranked the combined nodes; those are dropped.
        const savedTiers = isRecord(value.tiers) ? value.tiers : {}
        // Older saves have no list: Ignore was a tier, or the default's.
        const ignored = new Set(
            Array.isArray(value.ignored)
                ? value.ignored.filter(isStat)
                : DEFAULT_IGNORED.filter((stat) => !isTier(savedTiers[stat])),
        )
        const tiers = {} as Record<ArielPriorityStat, StatTier>
        for (const stat of ARIEL_PRIORITY_STATS) {
            const saved = savedTiers[stat]
            if (saved === "ignore") {
                ignored.add(stat)
            }

            tiers[stat] =
                isTier(saved) && saved !== "ignore" ? saved : usedTier(stat)
        }
        // Older saves have no order: special nodes first, as they always were.
        // Older saves also picked Ignore as a level; it's a clicked-off group now.
        const savedOrder = isRecord(value.order) ? value.order : {}
        const ignoredGroups = new Set(
            Array.isArray(value.ignoredGroups)
                ? value.ignoredGroups.filter(isGroup)
                : [],
        )
        const order = {} as Record<ArielRankGroup, ArielSameRankOrder>
        for (const group of ARIEL_RANK_GROUPS) {
            const saved = savedOrder[group]
            if (saved === "ignore") {
                ignoredGroups.add(group)
            }

            order[group] =
                isOrder(saved) && saved !== "ignore"
                    ? saved
                    : DEFAULT_ARIEL_RANK_ORDER[group]
        }

        return {
            points: isPoints(value.points)
                ? value.points
                : DEFAULT_ARIEL_POINTS,
            tiers: tiers,
            ignored: ARIEL_PRIORITY_STATS.filter((stat) => ignored.has(stat)),
            order: order,
            ignoredGroups: ARIEL_RANK_GROUPS.filter((group) => {
                return ignoredGroups.has(group)
            }),
        }
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? `Could not read Ariel settings: ${error.message}`
                : "Could not read Ariel settings.",
            { cause: error },
        )
    }
}

export const writeArielSettings = (
    classId: string,
    settings: ArielSettings,
) => {
    try {
        writeClassSettings(classId, "ariel", settings)
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save Ariel settings: ${error.message}`
            : "Could not save Ariel settings."
    }
}

// A combined node counts for both of its stats.
export const readArielStatNodeCounts = (classId: string) => {
    const counts = {} as Record<ArielPriorityStat, StatNodeCount>
    for (const stat of ARIEL_PRIORITY_STATS) {
        counts[stat] = { taken: 0, total: 0 }
    }

    const progress = readBoardProgress(classId, "ariel")
    if (progress.error) {
        throw new Error(progress.error)
    }

    const nodeStats = layouts.ariel.nodeStats
    for (const node of Object.values(nodeStats)) {
        for (const stat of ARIEL_NODE_GIVES[node]) {
            counts[stat].total += 1
        }
    }

    for (const key of progress.value?.plannedPath ?? []) {
        const node = nodeStats[key]
        if (!node) {
            continue
        }

        for (const stat of ARIEL_NODE_GIVES[node]) {
            counts[stat].taken += 1
        }
    }

    return counts
}
