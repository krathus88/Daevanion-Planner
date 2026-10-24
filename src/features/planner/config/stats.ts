import type { ArielStatType, BoardStat, StatType } from "@config/stats/stats"

// Stats only break ties between equal-cost routes, unless "spend leftover
// points" is on.
export const STAT_TIERS = ["best", "good", "okay", "ignore"] as const

export type StatTier = (typeof STAT_TIERS)[number]

export const STAT_TIER_NAMES: Record<StatTier, string> = {
    best: "Best",
    good: "Good",
    okay: "Okay",
    ignore: "Ignore",
}

export const DEFAULT_STAT_TIERS: Record<StatType, StatTier> = {
    attack: "best",
    "critical-hit": "best",
    "max-hp": "good",
    defense: "good",
    "critical-hit-resist": "okay",
    "max-mp": "ignore",
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

// Legacy: older saves set Stat focus per tier.
export const FOCUS_TIERS = ["best", "good", "okay"] as const

export type FocusTier = (typeof FOCUS_TIERS)[number]

// Far apart so one higher-tier node outweighs any number of lower ones.
const TIER_WEIGHTS: Record<StatTier, number> = {
    best: 1_000_000,
    good: 1_000,
    okay: 1,
    ignore: 0,
}

export const statWeights = <Stat extends BoardStat>(
    nodeStats: Readonly<Record<string, Stat>>,
    tiers: Readonly<Partial<Record<Stat, StatTier>>>,
) => {
    const weights = new Map<string, number>()
    for (const [key, stat] of Object.entries(nodeStats)) {
        const tier = tiers[stat]
        const weight = tier ? TIER_WEIGHTS[tier] : 0
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
