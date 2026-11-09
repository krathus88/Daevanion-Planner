import {
    ARIEL_NODE_GIVES,
    ARIEL_SPECIAL_STATS,
    type ArielPriorityStat,
    type ArielStatType,
    type BoardStat,
} from "@config/stats/stats"

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

// Within a tier, special nodes go before stat nodes, whatever they cost;
// still below the next tier up.
const SPECIAL_FACTOR = 1_000

export const arielNodeTierValue = (
    node: ArielStatType,
    tiers: Readonly<Record<ArielPriorityStat, StatTier>>,
) => {
    let value = 0
    for (const stat of ARIEL_NODE_GIVES[node]) {
        const isSpecial = (ARIEL_SPECIAL_STATS as readonly string[]).includes(
            stat,
        )
        value += TIER_WEIGHTS[tiers[stat]] * (isSpecial ? SPECIAL_FACTOR : 1)
    }

    return value
}

// The node's best tier among the stats it gives.
export const arielNodeTier = (
    node: ArielStatType,
    tiers: Readonly<Record<ArielPriorityStat, StatTier>>,
) => {
    let best: StatTier = "ignore"
    for (const stat of ARIEL_NODE_GIVES[node]) {
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
