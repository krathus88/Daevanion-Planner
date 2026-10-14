import { LAYOUT_NAMES, layouts } from "@planner/config/layouts"
import {
    DEFAULT_STAT_TIERS,
    FOCUS_TIERS,
    STAT_TIERS,
    STAT_TYPES,
    type FocusTier,
    type StatTier,
    type StatType,
} from "@planner/config/stats"
import { readBoardProgress } from "./boardStorage"
import { readClassSettings, writeClassSettings } from "./classSettings"
import { isRecord } from "./isRecord"

export type StatFocusTier = {
    // Passives ranked after this wait behind the tier's stat nodes. Null
    // never makes passives wait.
    passiveAfter: number | null
    // The same for skills.
    skillAfter: number | null
    // Most of the tier's stat nodes across all boards; null takes all the
    // budget allows.
    cap: number | null
}

// "Stat focus": stat nodes take points ahead of low-ranked abilities.
export type StatFocus = {
    enabled: boolean
    // Most points spent on other nodes to reach one stat node.
    detour: number
    tiers: Record<FocusTier, StatFocusTier>
}

export type StatSettings = {
    tiers: Record<StatType, StatTier>
    // Spend points left after Min and ranks on stat nodes.
    spendLeftover: boolean
    focus: StatFocus
}

export const DEFAULT_STAT_FOCUS: StatFocus = {
    enabled: false,
    detour: 1,
    tiers: {
        best: { passiveAfter: 3, skillAfter: null, cap: null },
        good: { passiveAfter: 4, skillAfter: null, cap: null },
        okay: { passiveAfter: null, skillAfter: null, cap: null },
    },
}

export const DEFAULT_STAT_SETTINGS: StatSettings = {
    tiers: DEFAULT_STAT_TIERS,
    spendLeftover: false,
    focus: DEFAULT_STAT_FOCUS,
}

const isTier = (value: unknown): value is StatTier => {
    return (
        typeof value === "string" &&
        (STAT_TIERS as readonly string[]).includes(value)
    )
}

const isCount = (value: unknown, min: number): value is number => {
    return typeof value === "number" && Number.isInteger(value) && value >= min
}

// A whole number of at least `min`, or null when the field was cleared.
const readOptionalCount = (
    value: unknown,
    min: number,
    fallback: number | null,
) => {
    if (value === null) {
        return null
    }

    return isCount(value, min) ? value : fallback
}

const readStatFocus = (value: unknown): StatFocus => {
    if (!isRecord(value)) {
        return DEFAULT_STAT_FOCUS
    }

    const tiers = isRecord(value.tiers) ? value.tiers : {}

    return {
        enabled: value.enabled === true,
        detour: isCount(value.detour, 0)
            ? value.detour
            : DEFAULT_STAT_FOCUS.detour,
        tiers: Object.fromEntries(
            FOCUS_TIERS.map((tier) => {
                const saved = isRecord(tiers[tier]) ? tiers[tier] : {}
                const fallback = DEFAULT_STAT_FOCUS.tiers[tier]
                // Older saves had one `afterRank` plus a scope of "passives"
                // or "all" (passives and skills).
                const legacyRank = readOptionalCount(
                    saved.afterRank,
                    1,
                    fallback.passiveAfter,
                )
                const isLegacy = "afterRank" in saved
                return [
                    tier,
                    {
                        passiveAfter: isLegacy
                            ? legacyRank
                            : readOptionalCount(
                                  saved.passiveAfter,
                                  1,
                                  fallback.passiveAfter,
                              ),
                        skillAfter: isLegacy
                            ? value.scope === "all"
                                ? legacyRank
                                : null
                            : readOptionalCount(
                                  saved.skillAfter,
                                  1,
                                  fallback.skillAfter,
                              ),
                        cap: readOptionalCount(saved.cap, 0, fallback.cap),
                    },
                ]
            }),
        ) as Record<FocusTier, StatFocusTier>,
    }
}

export const readStatSettings = (classId: string): StatSettings => {
    try {
        const value = readClassSettings(classId, "stats")
        if (value === undefined) {
            return DEFAULT_STAT_SETTINGS
        }

        if (!isRecord(value)) {
            throw new Error("Saved stat priorities are invalid.")
        }
        const tiers = isRecord(value.tiers) ? value.tiers : {}

        return {
            tiers: Object.fromEntries(
                STAT_TYPES.map((stat) => [
                    stat,
                    isTier(tiers[stat])
                        ? tiers[stat]
                        : DEFAULT_STAT_TIERS[stat],
                ]),
            ) as Record<StatType, StatTier>,
            spendLeftover: value.spendLeftover === true,
            focus: readStatFocus(value.focus),
        }
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? `Could not read stat priorities: ${error.message}`
                : "Could not read stat priorities.",
            { cause: error },
        )
    }
}

export const writeStatSettings = (classId: string, settings: StatSettings) => {
    try {
        writeClassSettings(classId, "stats", settings)
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save stat priorities: ${error.message}`
            : "Could not save stat priorities."
    }
}

export type StatNodeCount = {
    // Stat nodes on the boards' current routes.
    taken: number
    // Stat nodes on all four boards.
    total: number
}

// Stat nodes taken versus available, per stat, across every board.
export const readSharedStatNodeCounts = (classId: string) => {
    const counts = {} as Record<StatType, StatNodeCount>
    for (const stat of STAT_TYPES) {
        counts[stat] = { taken: 0, total: 0 }
    }

    for (const layout of LAYOUT_NAMES) {
        const progress = readBoardProgress(classId, layout)
        if (progress.error) {
            throw new Error(progress.error)
        }

        const nodeStats = layouts[layout].nodeStats
        for (const stat of Object.values(nodeStats)) {
            counts[stat].total += 1
        }

        for (const key of progress.value?.plannedPath ?? []) {
            const stat = nodeStats[key]
            if (stat) {
                counts[stat].taken += 1
            }
        }
    }

    return counts
}
