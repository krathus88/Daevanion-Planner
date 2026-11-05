import type { ArielStatType, BoardStat } from "@config/stats/stats"

// Ariel's stats are ranked by tier. Stats only break ties between equal-cost
// routes.
export const STAT_TIERS = ["best", "good", "okay", "ignore"] as const

export type StatTier = (typeof STAT_TIERS)[number]

export const STAT_TIER_NAMES: Record<StatTier, string> = {
    best: "Best",
    good: "Good",
    okay: "Okay",
    ignore: "Ignore",
}

export const DEFAULT_ARIEL_STAT_TIERS: Record<ArielStatType, StatTier> = {
    "pve-damage-boost": "best",
    "pve-damage-tolerance": "good",
    "boss-damage-boost": "best",
    "boss-damage-tolerance": "good",
    "ariel-critical-hit": "best",
    "ariel-critical-hit-resist": "okay",
    "pve-attack": "best",
    "pve-defense": "okay",
    "pve-attack-defense": "best",
    "pve-accuracy": "good",
    "pve-evasion": "okay",
    "pve-accuracy-evasion": "good",
    "boss-attack": "best",
    "boss-defense": "okay",
    "boss-attack-defense": "best",
    "ariel-max-hp": "okay",
    "ariel-max-mp": "ignore",
}

// Far apart so one higher-tier node outweighs any number of lower ones.
const TIER_WEIGHTS: Record<StatTier, number> = {
    best: 1_000_000,
    good: 1_000,
    okay: 1,
    ignore: 0,
}

export const tierValues = <Stat extends BoardStat>(
    tiers: Readonly<Partial<Record<Stat, StatTier>>>,
) => {
    const values: Partial<Record<Stat, number>> = {}
    for (const [stat, tier] of Object.entries(tiers) as [Stat, StatTier][]) {
        values[stat] = TIER_WEIGHTS[tier]
    }

    return values
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
