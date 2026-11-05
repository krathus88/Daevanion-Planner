import { STAT_TYPES, type StatType } from "@config/stats/stats"
import { MAIN_BOARD_IDS, type MainBoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import { readBoardProgress } from "./boardStorage"
import { readClassSettings, writeClassSettings } from "./classSettings"
import { isRecord } from "./isRecord"

export const MAX_STAT_RANK = 99

export type StatMax = {
    // Takes every node of the stat.
    enabled: boolean
    // It goes before skills ranked after this; null waits for every skill.
    skillAfter: number | null
    // It goes before passives ranked after this; null waits for every passive.
    passiveAfter: number | null
}

export type StatSettings = {
    // Best first. Every stat is in `order` or `ignored`, never both.
    order: StatType[]
    // Stats worth the same as the stat right above them in `order`.
    tied: StatType[]
    // Worth nothing and never maxed.
    ignored: StatType[]
    max: Record<StatType, StatMax>
}

const NO_MAX: StatMax = { enabled: false, skillAfter: null, passiveAfter: null }

const ATTACK_MAX: StatMax = { enabled: true, skillAfter: 5, passiveAfter: 4 }

// Off, but these ranks are ready when Max is turned on.
const DEFENSE_MAX: StatMax = { enabled: false, skillAfter: 6, passiveAfter: 5 }

export const DEFAULT_STAT_SETTINGS: StatSettings = {
    order: ["attack", "critical-hit", "defense", "max-hp"],
    tied: ["critical-hit", "max-hp"],
    ignored: ["critical-hit-resist", "max-mp"],
    max: {
        attack: ATTACK_MAX,
        "critical-hit": ATTACK_MAX,
        defense: DEFENSE_MAX,
        "max-hp": DEFENSE_MAX,
        "critical-hit-resist": NO_MAX,
        "max-mp": NO_MAX,
    },
}

export const isStatType = (value: unknown): value is StatType => {
    return (
        typeof value === "string" &&
        (STAT_TYPES as readonly string[]).includes(value)
    )
}

const isCount = (value: unknown, min: number): value is number => {
    return typeof value === "number" && Number.isInteger(value) && value >= min
}

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

const readRank = (value: unknown) => {
    const rank = readOptionalCount(value, 1, null)

    return rank === null ? null : Math.min(MAX_STAT_RANK, rank)
}

// #region Legacy
// Older saves gave each stat ranks: by tier, then with Stat focus, then as
// Skill/Passive ranks that also ordered the stats. They're read into ranks
// first, then turned into an order.
type LegacyRanked = {
    skillAfter: number | null
    passiveAfter: number | null
    max: boolean
}

const LEGACY_TIERS = ["best", "good", "okay", "ignore"] as const

type LegacyTier = (typeof LEGACY_TIERS)[number]

type LegacyFocusTier = Exclude<LegacyTier, "ignore">

type LegacyRanks = {
    passiveAfter: number | null
    skillAfter: number | null
}

type LegacyFocusStat = LegacyRanks & { detour: number }

const LEGACY_DEFAULT_TIERS: Record<StatType, LegacyTier> = {
    attack: "best",
    "critical-hit": "best",
    "max-hp": "good",
    defense: "good",
    "critical-hit-resist": "okay",
    "max-mp": "ignore",
}

// Late enough to come after the usual ability ranks, in tier order.
const TIER_RANKS: Record<LegacyTier, number | null> = {
    best: 90,
    good: 95,
    okay: MAX_STAT_RANK,
    ignore: null,
}

const LEGACY_FOCUS_DEFAULTS: Record<LegacyFocusTier, LegacyRanks> = {
    best: { passiveAfter: 3, skillAfter: null },
    good: { passiveAfter: 4, skillAfter: null },
    okay: { passiveAfter: null, skillAfter: null },
}

const LEGACY_DETOUR = 1

const isLegacyTier = (value: unknown): value is LegacyTier => {
    return (
        typeof value === "string" &&
        (LEGACY_TIERS as readonly string[]).includes(value)
    )
}

const fromTier = (tier: LegacyTier): LegacyRanked => {
    const rank = TIER_RANKS[tier]

    return { skillAfter: rank, passiveAfter: rank, max: false }
}

const readLegacyFocusTiers = (value: Record<string, unknown>) => {
    const tiers = isRecord(value.tiers) ? value.tiers : {}
    const result = {} as Record<LegacyFocusTier, LegacyRanks>
    for (const tier of ["best", "good", "okay"] as const) {
        const saved = isRecord(tiers[tier]) ? tiers[tier] : {}
        const fallback = LEGACY_FOCUS_DEFAULTS[tier]
        // Oldest saves: one `afterRank` plus a scope.
        if ("afterRank" in saved) {
            const rank = readOptionalCount(
                saved.afterRank,
                1,
                fallback.passiveAfter,
            )
            result[tier] = {
                passiveAfter: rank,
                skillAfter: value.scope === "all" ? rank : null,
            }
        } else {
            result[tier] = {
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
            }
        }
    }

    return result
}

// Per-tier focus didn't count the node itself in its detour, and a tier
// that never made anything wait wasn't focused.
const readLegacyFocus = (
    value: Record<string, unknown>,
    tiers: Readonly<Record<StatType, LegacyTier>>,
) => {
    const result = {} as Record<StatType, LegacyFocusStat>
    if (isRecord(value.stats)) {
        for (const stat of STAT_TYPES) {
            const saved = isRecord(value.stats[stat]) ? value.stats[stat] : {}
            result[stat] = {
                passiveAfter: readOptionalCount(saved.passiveAfter, 1, null),
                skillAfter: readOptionalCount(saved.skillAfter, 1, null),
                detour: isCount(saved.detour, 0) ? saved.detour : 0,
            }
        }

        return result
    }

    const focusTiers = readLegacyFocusTiers(value)
    const detour = isCount(value.detour, 0) ? value.detour : LEGACY_DETOUR
    for (const stat of STAT_TYPES) {
        const tier = tiers[stat]
        const saved = tier === "ignore" ? null : focusTiers[tier]
        const isFocused =
            saved !== null &&
            (saved.passiveAfter !== null || saved.skillAfter !== null)
        result[stat] = {
            passiveAfter: saved?.passiveAfter ?? null,
            skillAfter: saved?.skillAfter ?? null,
            detour: isFocused ? detour + 1 : 0,
        }
    }

    return result
}

// With Stat focus on, its ranks are kept and a detour above 0 becomes Max.
const readTierStats = (value: Record<string, unknown>) => {
    const savedTiers = isRecord(value.tiers) ? value.tiers : {}
    const tiers = {} as Record<StatType, LegacyTier>
    for (const stat of STAT_TYPES) {
        const saved = savedTiers[stat]
        tiers[stat] = isLegacyTier(saved) ? saved : LEGACY_DEFAULT_TIERS[stat]
    }

    const focus = isRecord(value.focus) ? value.focus : null
    const focusStats =
        focus?.enabled === true ? readLegacyFocus(focus, tiers) : null
    const stats = {} as Record<StatType, LegacyRanked>
    for (const stat of STAT_TYPES) {
        const tier = tiers[stat]
        const focused = focusStats?.[stat]
        if (tier === "ignore" || !focused) {
            stats[stat] = fromTier(tier)
            continue
        }

        const hasRanks =
            focused.skillAfter !== null || focused.passiveAfter !== null
        const ranks = hasRanks ? focused : fromTier(tier)
        stats[stat] = {
            skillAfter: ranks.skillAfter,
            passiveAfter: ranks.passiveAfter,
            max: focused.detour > 0,
        }
    }

    return stats
}

const readRankedStats = (saved: Record<string, unknown>) => {
    const stats = {} as Record<StatType, LegacyRanked>
    for (const stat of STAT_TYPES) {
        const entry = isRecord(saved[stat]) ? saved[stat] : {}
        stats[stat] = {
            skillAfter: readRank(entry.skillAfter),
            passiveAfter: readRank(entry.passiveAfter),
            max: entry.max === true,
        }
    }

    return stats
}

const compareRanks = (left: number, right: number) => {
    if (left === right) {
        return 0
    }

    return left < right ? -1 : 1
}

// An empty rank comes after every number.
const sortedRanks = (ranked: LegacyRanked) => {
    const ranks = [
        ranked.skillAfter ?? Number.POSITIVE_INFINITY,
        ranked.passiveAfter ?? Number.POSITIVE_INFINITY,
    ]

    return ranks.sort(compareRanks)
}

// Lower ranks first: the lower of the two, then the other.
const compareRanked = (left: LegacyRanked, right: LegacyRanked) => {
    const leftRanks = sortedRanks(left)
    const rightRanks = sortedRanks(right)

    return (
        compareRanks(leftRanks[0], rightRanks[0]) ||
        compareRanks(leftRanks[1], rightRanks[1])
    )
}

// Both ranks empty was ignored, equal ranks tie. Ranks stay only for maxed
// stats, where they still say when.
const fromRanked = (
    stats: Readonly<Record<StatType, LegacyRanked>>,
): StatSettings => {
    const isIgnored = (stat: StatType) => {
        return (
            stats[stat].skillAfter === null && stats[stat].passiveAfter === null
        )
    }

    const order = STAT_TYPES.filter((stat) => !isIgnored(stat)).sort(
        (left, right) => compareRanked(stats[left], stats[right]),
    )
    const tied = order.filter((stat, index) => {
        return (
            index > 0 &&
            compareRanked(stats[stat], stats[order[index - 1]]) === 0
        )
    })
    const max = {} as Record<StatType, StatMax>
    for (const stat of STAT_TYPES) {
        const ranked = stats[stat]
        max[stat] =
            ranked.max && !isIgnored(stat)
                ? {
                      enabled: true,
                      skillAfter: ranked.skillAfter,
                      passiveAfter: ranked.passiveAfter,
                  }
                : NO_MAX
    }

    return {
        order: order,
        tied: tied,
        ignored: STAT_TYPES.filter(isIgnored),
        max: max,
    }
}
// #endregion

const readStatList = (value: unknown, taken: Set<StatType>) => {
    const stats: StatType[] = []
    if (!Array.isArray(value)) {
        return stats
    }

    for (const stat of value) {
        if (isStatType(stat) && !taken.has(stat)) {
            taken.add(stat)
            stats.push(stat)
        }
    }

    return stats
}

const readMax = (value: unknown) => {
    const saved = isRecord(value) ? value : {}
    const max = {} as Record<StatType, StatMax>
    for (const stat of STAT_TYPES) {
        const entry = isRecord(saved[stat]) ? saved[stat] : {}
        max[stat] = {
            enabled: entry.enabled === true,
            skillAfter: readRank(entry.skillAfter),
            passiveAfter: readRank(entry.passiveAfter),
        }
    }

    return max
}

// Stats missing from both lists go last in the order.
const readOrdered = (value: Record<string, unknown>): StatSettings => {
    const taken = new Set<StatType>()
    const order = readStatList(value.order, taken)
    const ignored = readStatList(value.ignored, taken)
    for (const stat of STAT_TYPES) {
        if (!taken.has(stat)) {
            order.push(stat)
        }
    }

    const savedTied = Array.isArray(value.tied) ? value.tied : []
    return {
        order: order,
        tied: order.filter((stat, index) => {
            return index > 0 && savedTied.includes(stat)
        }),
        ignored: ignored,
        max: readMax(value.max),
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

        if (Array.isArray(value.order)) {
            return readOrdered(value)
        }

        return isRecord(value.stats) && !("tiers" in value)
            ? fromRanked(readRankedStats(value.stats))
            : fromRanked(readTierStats(value))
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
    taken: number
    total: number
}

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
