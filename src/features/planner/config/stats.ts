// The stat each stat (basic) node gives. Which node gives which stat is set
// per board in layouts.ts (`nodeStats`) and is the same for every class.
export const STAT_TYPES = [
    "attack",
    "critical-hit",
    "max-hp",
    "defense",
    "critical-hit-resist",
    "max-mp",
] as const

export type StatType = (typeof STAT_TYPES)[number]

export const STAT_NAMES: Record<StatType, string> = {
    attack: "Attack",
    "critical-hit": "Critical Hit",
    "max-hp": "Max HP",
    defense: "Defense",
    "critical-hit-resist": "Critical Hit Resist",
    "max-mp": "Max MP",
}

// Shown in a stat node's tooltip.
export const STAT_TOOLTIPS: Record<StatType, string> = {
    attack: "Attack +3",
    "critical-hit": "Critical Hit +5",
    "max-hp": "Max HP +100",
    defense: "Defense +30",
    "critical-hit-resist": "Critical Hit Resist +5",
    "max-mp": "Max MP +50",
}

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
    "max-mp": "okay",
}

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
