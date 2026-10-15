// The stat each stat (basic) node gives. Which node gives which stat is set
// per board in @planner/config/layouts.ts (`nodeStats`) and is the same for
// every class.
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
