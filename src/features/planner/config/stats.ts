import type { StatType } from "@config/stats/stats"

// How much the user values a stat. Stats only ever break ties between routes
// of equal cost, unless "spend leftover points" is on.
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

// Tiers that older saves set Stat focus for, highest first; Stat focus is
// now set per stat.
export const FOCUS_TIERS = ["best", "good", "okay"] as const

export type FocusTier = (typeof FOCUS_TIERS)[number]

// Far apart so one node of a higher tier outweighs any number of nodes of a
// lower tier.
const TIER_WEIGHTS: Record<StatTier, number> = {
    best: 1_000_000,
    good: 1_000,
    okay: 1,
    ignore: 0,
}

// Weight of each stat node on a board ("row,col" -> weight), for the
// pathfinder's tie-breaking. Nodes whose stat is ignored are left out.
export const statWeights = (
    nodeStats: Readonly<Record<string, StatType>>,
    tiers: Readonly<Record<StatType, StatTier>>,
) => {
    const weights = new Map<string, number>()
    for (const [key, stat] of Object.entries(nodeStats)) {
        const weight = TIER_WEIGHTS[tiers[stat]]
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
