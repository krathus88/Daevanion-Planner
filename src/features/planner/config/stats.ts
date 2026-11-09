import {
    ARIEL_NODE_GIVES,
    isArielSpecialStat,
    type ArielPriorityStat,
    type ArielStatType,
    type BoardStat,
} from "@config/stats/stats"
import { SAME_RANK_ORDERS } from "@planner/storage/rankOrder"

// Ariel's stats are ranked by tier. A node is worth the tiers of every stat
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

// Far apart so one higher-tier node outweighs any number of lower ones.
const TIER_WEIGHTS: Record<StatTier, number> = {
    best: 1_000_000_000_000,
    good: 1_000_000,
    okay: 1,
    ignore: 0,
}

// Within a tier, Ariel's groups (offensive/defensive special nodes and
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

// Everything else is offensive. Max MP sits with the defensive stats.
const DEFENSIVE_ARIEL_STATS: ReadonlySet<ArielPriorityStat> = new Set([
    "pve-damage-tolerance",
    "boss-damage-tolerance",
    "pve-defense",
    "pve-evasion",
    "boss-defense",
    "ariel-critical-hit-resist",
    "ariel-max-hp",
    "ariel-max-mp",
])

const arielRankGroup = (stat: ArielPriorityStat): ArielRankGroup => {
    const side = DEFENSIVE_ARIEL_STATS.has(stat) ? "defense" : "offense"
    return isArielSpecialStat(stat) ? `special-${side}` : `stat-${side}`
}

const RANK_ORDER_WEIGHTS: Record<ArielSameRankOrder, number> = {
    more: 100,
    equal: 10,
    less: 1,
    ignore: 0,
}

export const arielNodeTierValue = (
    node: ArielStatType,
    tiers: Readonly<Record<ArielPriorityStat, StatTier>>,
    order: ArielRankOrder,
) => {
    let value = 0
    for (const stat of ARIEL_NODE_GIVES[node]) {
        value +=
            TIER_WEIGHTS[tiers[stat]] *
            RANK_ORDER_WEIGHTS[order[arielRankGroup(stat)]]
    }

    return value
}

// The node's best tier among the stats it gives; stats of an ignored
// group don't count.
export const arielNodeTier = (
    node: ArielStatType,
    tiers: Readonly<Record<ArielPriorityStat, StatTier>>,
    order: ArielRankOrder,
) => {
    let best: StatTier = "ignore"
    for (const stat of ARIEL_NODE_GIVES[node]) {
        if (order[arielRankGroup(stat)] === "ignore") {
            continue
        }

        if (STAT_TIERS.indexOf(tiers[stat]) < STAT_TIERS.indexOf(best)) {
            best = tiers[stat]
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
