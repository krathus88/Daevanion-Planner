import { STAT_TYPES, type StatType } from "@config/stats/stats"
import { MAIN_BOARD_IDS, type MainBoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import {
    DEFAULT_STAT_TIERS,
    FOCUS_TIERS,
    STAT_TIERS,
    type FocusTier,
    type StatTier,
} from "@planner/config/stats"
import { readBoardProgress } from "./boardStorage"
import { readClassSettings, writeClassSettings } from "./classSettings"
import { isRecord } from "./isRecord"

// Stat focus for one stat.
export type StatFocusStat = {
    // All boards: passives ranked after this wait behind the stat's nodes.
    // Null never makes passives wait.
    passiveAfter: number | null
    // The same for skills.
    skillAfter: number | null
    // Most points one of its nodes may cost to reach, the node included:
    // 1 takes nodes touching the route. 0 never adds the stat.
    detour: number
}

// "Stat focus": stat nodes are added to the route, and on All boards take
// points ahead of low-ranked abilities.
export type StatFocus = {
    enabled: boolean
    stats: Record<StatType, StatFocusStat>
}

export type StatSettings = {
    tiers: Record<StatType, StatTier>
    // Spend points left after Min and ranks on stat nodes.
    spendLeftover: boolean
    focus: StatFocus
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

// Older saves set Stat focus per tier (Best, Good, Okay), with one detour
// for all of them that didn't count the stat node itself.
type LegacyFocusTier = {
    passiveAfter: number | null
    skillAfter: number | null
}

const LEGACY_FOCUS_DEFAULTS: Record<FocusTier, LegacyFocusTier> = {
    best: { passiveAfter: 3, skillAfter: null },
    good: { passiveAfter: 4, skillAfter: null },
    okay: { passiveAfter: null, skillAfter: null },
}

const LEGACY_DETOUR = 1

const readLegacyTiers = (value: Record<string, unknown>) => {
    const tiers = isRecord(value.tiers) ? value.tiers : {}

    return Object.fromEntries(
        FOCUS_TIERS.map((tier) => {
            const saved = isRecord(tiers[tier]) ? tiers[tier] : {}
            const fallback = LEGACY_FOCUS_DEFAULTS[tier]
            // The oldest saves had one `afterRank` plus a scope of
            // "passives" or "all" (passives and skills).
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
                },
            ]
        }),
    ) as Record<FocusTier, LegacyFocusTier>
}

// Each stat takes its tier's ranks. A tier that never made anything wait
// wasn't focused, so its stats start at detour 0.
const fromLegacyTiers = (
    tiers: Record<FocusTier, LegacyFocusTier>,
    detour: number,
    statTiers: Readonly<Record<StatType, StatTier>>,
) => {
    return Object.fromEntries(
        STAT_TYPES.map((stat) => {
            const tier = statTiers[stat]
            const saved = tier === "ignore" ? null : tiers[tier]
            const isFocused =
                saved !== null &&
                (saved.passiveAfter !== null || saved.skillAfter !== null)
            return [
                stat,
                {
                    passiveAfter: saved?.passiveAfter ?? null,
                    skillAfter: saved?.skillAfter ?? null,
                    detour: isFocused ? detour + 1 : 0,
                },
            ]
        }),
    ) as Record<StatType, StatFocusStat>
}

// Best stats take nodes touching the route; the rest aren't added.
const defaultStatFocus = (
    statTiers: Readonly<Record<StatType, StatTier>>,
): StatFocus => {
    const ranks = fromLegacyTiers(LEGACY_FOCUS_DEFAULTS, 0, statTiers)
    return {
        enabled: false,
        stats: Object.fromEntries(
            STAT_TYPES.map((stat) => [
                stat,
                { ...ranks[stat], detour: statTiers[stat] === "best" ? 1 : 0 },
            ]),
        ) as Record<StatType, StatFocusStat>,
    }
}

export const DEFAULT_STAT_SETTINGS: StatSettings = {
    tiers: DEFAULT_STAT_TIERS,
    spendLeftover: false,
    focus: defaultStatFocus(DEFAULT_STAT_TIERS),
}

const readStatFocus = (
    value: unknown,
    statTiers: Readonly<Record<StatType, StatTier>>,
): StatFocus => {
    if (!isRecord(value)) {
        return defaultStatFocus(statTiers)
    }

    if (!isRecord(value.stats)) {
        return {
            enabled: value.enabled === true,
            stats: fromLegacyTiers(
                readLegacyTiers(value),
                isCount(value.detour, 0) ? value.detour : LEGACY_DETOUR,
                statTiers,
            ),
        }
    }

    const defaults = defaultStatFocus(statTiers).stats
    const stats = value.stats
    return {
        enabled: value.enabled === true,
        stats: Object.fromEntries(
            STAT_TYPES.map((stat) => {
                const saved = isRecord(stats[stat]) ? stats[stat] : {}
                const fallback = defaults[stat]
                return [
                    stat,
                    {
                        passiveAfter: readOptionalCount(
                            saved.passiveAfter,
                            1,
                            fallback.passiveAfter,
                        ),
                        skillAfter: readOptionalCount(
                            saved.skillAfter,
                            1,
                            fallback.skillAfter,
                        ),
                        detour: isCount(saved.detour, 0)
                            ? saved.detour
                            : fallback.detour,
                    },
                ]
            }),
        ) as Record<StatType, StatFocusStat>,
    }
}

export const readStatSettings = (
    classId: string,
    source?: Record<string, unknown>,
): StatSettings => {
    try {
        const value = readClassSettings(classId, "stats", source)
        if (value === undefined) {
            return DEFAULT_STAT_SETTINGS
        }

        if (!isRecord(value)) {
            throw new Error("Saved stat priorities are invalid.")
        }
        const savedTiers = isRecord(value.tiers) ? value.tiers : {}
        const tiers = Object.fromEntries(
            STAT_TYPES.map((stat) => [
                stat,
                isTier(savedTiers[stat])
                    ? savedTiers[stat]
                    : DEFAULT_STAT_TIERS[stat],
            ]),
        ) as Record<StatType, StatTier>

        return {
            tiers: tiers,
            spendLeftover: value.spendLeftover === true,
            focus: readStatFocus(value.focus, tiers),
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
    // Stat nodes on the counted boards.
    total: number
}

// Stat nodes taken versus available, per stat, across the given boards
// (all by default).
export const readSharedStatNodeCounts = (
    classId: string,
    boards: readonly MainBoardId[] = MAIN_BOARD_IDS,
) => {
    const counts = {} as Record<StatType, StatNodeCount>
    for (const stat of STAT_TYPES) {
        counts[stat] = { taken: 0, total: 0 }
    }

    for (const layout of boards) {
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
