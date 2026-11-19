import { BOARD_NAMES, type StatBoardId } from "@config/boards"
import {
    ARIEL_PRIORITY_STATS,
    AZPHEL_PRIORITY_STATS,
    STAT_BOARD_NODE_GIVES,
    type StatBoardStat,
} from "@config/stats/stats"
import { layouts } from "@planner/config/layouts"
import {
    ARIEL_RANK_GROUPS,
    ARIEL_SAME_RANK_ORDERS,
    DEFAULT_ARIEL_RANK_ORDER,
    DEFAULT_AZPHEL_RANK_ORDER,
    DEFAULT_ARIEL_STAT_TIERS,
    DEFAULT_AZPHEL_STAT_TIERS,
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

// Ariel's or Azphel's settings; each keeps its own, under its board id.
export type StatBoardSettings = {
    points: number
    // Best, Good or Okay per stat of the board; an ignored stat keeps its
    // tier for when it's used again (`arielTiers` gives the tiers with Ignore).
    tiers: Partial<Record<StatBoardStat, StatTier>>
    // Clicked off by name, like an ability's Skip.
    ignored: StatBoardStat[]
    // Within a tier: which of the offensive/defensive special nodes and stats
    // go first (More/Equal/Less). An ignored group keeps its level for when
    // it's used again (`arielOrder` gives the order with Ignore).
    order: ArielRankOrder
    // Groups clicked off by name.
    ignoredGroups: ArielRankGroup[]
}

export type ArielSettings = StatBoardSettings

// The stats each board ranks, and their default tiers.
const STAT_BOARD_PRIORITY_STATS: Record<StatBoardId, readonly StatBoardStat[]> =
    {
        ariel: ARIEL_PRIORITY_STATS,
        azphel: AZPHEL_PRIORITY_STATS,
    }

const DEFAULT_ORDERS: Record<StatBoardId, ArielRankOrder> = {
    ariel: DEFAULT_ARIEL_RANK_ORDER,
    azphel: DEFAULT_AZPHEL_RANK_ORDER,
}

const DEFAULT_TIERS: Record<
    StatBoardId,
    Readonly<Partial<Record<StatBoardStat, StatTier>>>
> = {
    ariel: DEFAULT_ARIEL_STAT_TIERS,
    azphel: DEFAULT_AZPHEL_STAT_TIERS,
}

// Points come from the board's own crystals: Ariel's are earned in dungeons,
// so none until the user says; Azphel starts at 36.
const DEFAULT_POINTS: Record<StatBoardId, number> = {
    ariel: 0,
    azphel: 36,
}

// The tier a stat that starts ignored gets once it's used.
const usedTier = (board: StatBoardId, stat: StatBoardStat): StatTier => {
    const tier = DEFAULT_TIERS[board][stat] ?? "okay"
    return tier === "ignore" ? "okay" : tier
}

const defaultIgnored = (board: StatBoardId) => {
    return STAT_BOARD_PRIORITY_STATS[board].filter((stat) => {
        return DEFAULT_TIERS[board][stat] === "ignore"
    })
}

const defaultSettings = (board: StatBoardId): StatBoardSettings => {
    return {
        points: DEFAULT_POINTS[board],
        tiers: Object.fromEntries(
            STAT_BOARD_PRIORITY_STATS[board].map((stat) => [
                stat,
                usedTier(board, stat),
            ]),
        ),
        ignored: defaultIgnored(board),
        order: DEFAULT_ORDERS[board],
        ignoredGroups: [],
    }
}

export const DEFAULT_STAT_BOARD_SETTINGS: Record<
    StatBoardId,
    StatBoardSettings
> = {
    ariel: defaultSettings("ariel"),
    azphel: defaultSettings("azphel"),
}

export const DEFAULT_ARIEL_SETTINGS = DEFAULT_STAT_BOARD_SETTINGS.ariel

const isGroup = (value: unknown): value is ArielRankGroup => {
    return (
        typeof value === "string" &&
        (ARIEL_RANK_GROUPS as readonly string[]).includes(value)
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

export const readStatBoardSettings = (
    classId: string,
    board: StatBoardId,
): StatBoardSettings => {
    const name = BOARD_NAMES[board]
    try {
        const value = readClassSettings(classId, board)
        if (value === undefined) {
            return DEFAULT_STAT_BOARD_SETTINGS[board]
        }

        if (!isRecord(value)) {
            throw new Error(`Saved ${name} settings are invalid.`)
        }

        const stats = STAT_BOARD_PRIORITY_STATS[board]
        const isStat = (stat: unknown): stat is StatBoardStat => {
            return (
                typeof stat === "string" &&
                (stats as readonly string[]).includes(stat)
            )
        }
        // Older saves also ranked the combined nodes; those are dropped.
        const savedTiers = isRecord(value.tiers) ? value.tiers : {}
        // Older saves have no list: Ignore was a tier, or the default's.
        const ignored = new Set(
            Array.isArray(value.ignored)
                ? value.ignored.filter(isStat)
                : defaultIgnored(board).filter((stat) => {
                      return !isTier(savedTiers[stat])
                  }),
        )
        const tiers: Partial<Record<StatBoardStat, StatTier>> = {}
        for (const stat of stats) {
            const saved = savedTiers[stat]
            if (saved === "ignore") {
                ignored.add(stat)
            }

            tiers[stat] =
                isTier(saved) && saved !== "ignore"
                    ? saved
                    : usedTier(board, stat)
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
                    : DEFAULT_ORDERS[board][group]
        }

        return {
            points: isPoints(value.points)
                ? value.points
                : DEFAULT_POINTS[board],
            tiers: tiers,
            ignored: stats.filter((stat) => ignored.has(stat)),
            order: order,
            ignoredGroups: ARIEL_RANK_GROUPS.filter((group) => {
                return ignoredGroups.has(group)
            }),
        }
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? `Could not read ${name} settings: ${error.message}`
                : `Could not read ${name} settings.`,
            { cause: error },
        )
    }
}

export const writeStatBoardSettings = (
    classId: string,
    board: StatBoardId,
    settings: StatBoardSettings,
) => {
    const name = BOARD_NAMES[board]
    try {
        writeClassSettings(classId, board, settings)
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save ${name} settings: ${error.message}`
            : `Could not save ${name} settings.`
    }
}

// All boards plans Ariel; these read and write its settings.
export const readArielSettings = (classId: string) => {
    return readStatBoardSettings(classId, "ariel")
}

export const writeArielSettings = (
    classId: string,
    settings: StatBoardSettings,
) => {
    return writeStatBoardSettings(classId, "ariel", settings)
}

// A combined node counts for both of its stats.
export const readStatBoardNodeCounts = (
    classId: string,
    board: StatBoardId,
) => {
    const counts: Partial<Record<StatBoardStat, StatNodeCount>> = {}
    for (const stat of STAT_BOARD_PRIORITY_STATS[board]) {
        counts[stat] = { taken: 0, total: 0 }
    }

    const progress = readBoardProgress(classId, board)
    if (progress.error) {
        throw new Error(progress.error)
    }

    const nodeStats = layouts[board].nodeStats as Readonly<
        Record<string, keyof typeof STAT_BOARD_NODE_GIVES>
    >
    for (const node of Object.values(nodeStats)) {
        for (const stat of STAT_BOARD_NODE_GIVES[node]) {
            const count = counts[stat]
            if (count) {
                count.total += 1
            }
        }
    }

    for (const key of progress.value?.plannedPath ?? []) {
        const node = nodeStats[key]
        if (!node) {
            continue
        }

        for (const stat of STAT_BOARD_NODE_GIVES[node]) {
            const count = counts[stat]
            if (count) {
                count.taken += 1
            }
        }
    }

    return counts
}
