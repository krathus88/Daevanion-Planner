import {
    ARIEL_SPECIAL_STATS,
    AZPHEL_SPECIAL_STATS,
    STAT_BOARD_NODE_GIVES,
    type ArielPriorityStat,
    type AzphelPriorityStat,
    type BoardStat,
    type StatBoardNode,
    type StatBoardStat,
} from "@config/stats/stats"
import { SAME_RANK_ORDERS } from "@planner/storage/rankOrder"

// Ariel's and Azphel's stats are ranked by tier. A node is worth the tiers of every stat
// it gives.
export const STAT_TIERS = ["best", "good", "okay", "ignore"] as const

export type StatTier = (typeof STAT_TIERS)[number]

export const STAT_TIER_NAMES: Record<StatTier, string> = {
    best: "Best",
    good: "Good",
    okay: "Okay",
    ignore: "Ignore",
}

export const DEFAULT_ARIEL_STAT_TIERS: Record<ArielPriorityStat, StatTier> = {
    "pve-damage-boost": "best",
    "pve-damage-tolerance": "okay",
    "pve-attack": "best",
    "pve-defense": "okay",
    "pve-accuracy": "good",
    "pve-evasion": "ignore",
    "boss-attack": "best",
    "boss-defense": "okay",
    "boss-damage-boost": "best",
    "boss-damage-tolerance": "okay",
    "ariel-critical-hit": "good",
    "ariel-critical-hit-resist": "ignore",
    "ariel-max-hp": "okay",
    "ariel-max-mp": "ignore",
}

// PvP: damage and hitting first, then holding up.
export const DEFAULT_AZPHEL_STAT_TIERS: Record<AzphelPriorityStat, StatTier> = {
    "pvp-damage-boost": "best",
    "pvp-damage-tolerance": "best",
    "pvp-attack": "best",
    "pvp-defense": "good",
    "pvp-accuracy": "good",
    "pvp-evasion": "okay",
    "pvp-critical-hit": "good",
    "pvp-critical-hit-resist": "okay",
    "status-effect-chance": "okay",
    "status-effect-resist": "okay",
    "azphel-max-hp": "okay",
    "azphel-max-mp": "ignore",
}

// A stat a board's saved tiers leave out counts as ignored.
export type StatBoardTiers = Readonly<Partial<Record<StatBoardStat, StatTier>>>

// Far apart so one higher-tier node outweighs any number of lower ones.
const TIER_WEIGHTS: Record<StatTier, number> = {
    best: 1_000_000_000_000,
    good: 1_000_000,
    okay: 1,
    ignore: 0,
}

// Within a tier, a stat board's groups (offensive/defensive special nodes and
// stats) go by their same-rank order: More before Equal before Less, whatever the nodes cost (a level is
// worth 10x, more than the 4x cost gap), still below the next tier up.
// Equal levels go by value per point. Ignore (a group clicked off by name,
// see `arielOrder`) makes its stats worth nothing, whatever their tier.
export const ARIEL_SAME_RANK_ORDERS = [...SAME_RANK_ORDERS, "ignore"] as const
export type ArielSameRankOrder = (typeof ARIEL_SAME_RANK_ORDERS)[number]

export const ARIEL_RANK_GROUPS = [
    "special-offense",
    "special-defense",
    "stat-offense",
    "stat-defense",
] as const
export type ArielRankGroup = (typeof ARIEL_RANK_GROUPS)[number]
export type ArielRankOrder = Readonly<
    Record<ArielRankGroup, ArielSameRankOrder>
>

export const ARIEL_RANK_GROUP_NAMES: Record<ArielRankGroup, string> = {
    "special-offense": "Offensive special nodes",
    "special-defense": "Defensive special nodes",
    "stat-offense": "Offensive stats",
    "stat-defense": "Defensive stats",
}

// Special nodes first, as before the order could be picked.
export const DEFAULT_ARIEL_RANK_ORDER: ArielRankOrder = {
    "special-offense": "more",
    "special-defense": "more",
    "stat-offense": "equal",
    "stat-defense": "equal",
}

// Azphel: offensive special nodes first, then defensive ones, stats last.
export const DEFAULT_AZPHEL_RANK_ORDER: ArielRankOrder = {
    "special-offense": "more",
    "special-defense": "equal",
    "stat-offense": "less",
    "stat-defense": "less",
}

// Everything else is offensive. Max MP sits with the defensive stats.
const DEFENSIVE_STATS: ReadonlySet<StatBoardStat> = new Set([
    "pve-damage-tolerance",
    "boss-damage-tolerance",
    "pve-defense",
    "pve-evasion",
    "boss-defense",
    "ariel-critical-hit-resist",
    "ariel-max-hp",
    "ariel-max-mp",
    "pvp-damage-tolerance",
    "pvp-defense",
    "pvp-evasion",
    "pvp-critical-hit-resist",
    "status-effect-resist",
    "azphel-max-hp",
    "azphel-max-mp",
])

const SPECIAL_STATS: ReadonlySet<StatBoardStat> = new Set([
    ...ARIEL_SPECIAL_STATS,
    ...AZPHEL_SPECIAL_STATS,
])

const statRankGroup = (stat: StatBoardStat): ArielRankGroup => {
    const side = DEFENSIVE_STATS.has(stat) ? "defense" : "offense"
    return SPECIAL_STATS.has(stat) ? `special-${side}` : `stat-${side}`
}

const RANK_ORDER_WEIGHTS: Record<ArielSameRankOrder, number> = {
    more: 100,
    equal: 10,
    less: 1,
    ignore: 0,
}

export const statNodeTierValue = (
    node: StatBoardNode,
    tiers: StatBoardTiers,
    order: ArielRankOrder,
) => {
    let value = 0
    for (const stat of STAT_BOARD_NODE_GIVES[node]) {
        value +=
            TIER_WEIGHTS[tiers[stat] ?? "ignore"] *
            RANK_ORDER_WEIGHTS[order[statRankGroup(stat)]]
    }

    return value
}

// The node's best tier among the stats it gives; stats of an ignored
// group don't count.
export const statNodeTier = (
    node: StatBoardNode,
    tiers: StatBoardTiers,
    order: ArielRankOrder,
) => {
    let best: StatTier = "ignore"
    for (const stat of STAT_BOARD_NODE_GIVES[node]) {
        const tier = tiers[stat] ?? "ignore"
        if (order[statRankGroup(stat)] === "ignore") {
            continue
        }

        if (STAT_TIERS.indexOf(tier) < STAT_TIERS.indexOf(best)) {
            best = tier
        }
    }

    return best
}

// Missing or 0 values add nothing.
export const statWeights = <Stat extends BoardStat>(
    nodeStats: Readonly<Record<string, Stat>>,
    values: Readonly<Partial<Record<Stat, number>>>,
) => {
    const weights = new Map<string, number>()
    for (const [key, stat] of Object.entries(nodeStats)) {
        const weight = values[stat] ?? 0
        if (weight > 0) {
            weights.set(key, weight)
        }
    }

    return weights
}

export const routeStatScore = (
    path: Iterable<string>,
    weights: ReadonlyMap<string, number>,
) => {
    let score = 0
    for (const key of path) {
        score += weights.get(key) ?? 0
    }

    return score
}
