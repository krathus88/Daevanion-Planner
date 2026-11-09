import {
    ARIEL_NODE_GIVES,
    ARIEL_PRIORITY_STATS,
    type ArielPriorityStat,
} from "@config/stats/stats"
import { layouts } from "@planner/config/layouts"
import {
    DEFAULT_ARIEL_STAT_TIERS,
    STAT_TIERS,
    type StatTier,
} from "@planner/config/stats"
import { readBoardProgress } from "./boardStorage"
import { readClassSettings, writeClassSettings } from "./classSettings"
import { isRecord } from "./isRecord"
import type { StatNodeCount } from "./statPriorities"

export type ArielSettings = {
    points: number
    tiers: Record<ArielPriorityStat, StatTier>
}

// Max 60: 30 each from Krao Cave and Draupnir.
const DEFAULT_ARIEL_POINTS = 0

export const DEFAULT_ARIEL_SETTINGS: ArielSettings = {
    points: DEFAULT_ARIEL_POINTS,
    tiers: DEFAULT_ARIEL_STAT_TIERS,
}

const isTier = (value: unknown): value is StatTier => {
    return (
        typeof value === "string" &&
        (STAT_TIERS as readonly string[]).includes(value)
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
        const tiers = Object.fromEntries(
            ARIEL_PRIORITY_STATS.map((stat) => [
                stat,
                isTier(savedTiers[stat])
                    ? savedTiers[stat]
                    : DEFAULT_ARIEL_STAT_TIERS[stat],
            ]),
        ) as Record<ArielPriorityStat, StatTier>

        return {
            points: isPoints(value.points)
                ? value.points
                : DEFAULT_ARIEL_POINTS,
            tiers: tiers,
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
