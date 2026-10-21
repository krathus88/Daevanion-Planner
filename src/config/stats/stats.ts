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

// The stats on Ariel's nodes. They have their own priorities, so Ariel's
// Critical Hit, Max HP and Max MP are separate from the other boards'.
// Nodes that give two stats are their own entry.
export const ARIEL_STAT_TYPES = [
    "pve-damage-boost",
    "pve-damage-tolerance",
    "boss-damage-boost",
    "boss-damage-tolerance",
    "ariel-critical-hit",
    "ariel-critical-hit-resist",
    "pve-attack",
    "pve-defense",
    "pve-attack-defense",
    "pve-accuracy",
    "pve-evasion",
    "pve-accuracy-evasion",
    "boss-attack",
    "boss-defense",
    "boss-attack-defense",
    "ariel-max-hp",
    "ariel-max-mp",
] as const

export type ArielStatType = (typeof ARIEL_STAT_TYPES)[number]

export const ARIEL_STAT_NAMES: Record<ArielStatType, string> = {
    "pve-damage-boost": "PvE Damage Boost",
    "pve-damage-tolerance": "PvE Damage Tolerance",
    "boss-damage-boost": "Boss Damage Boost",
    "boss-damage-tolerance": "Boss Damage Tolerance",
    "ariel-critical-hit": "Critical Hit",
    "ariel-critical-hit-resist": "Critical Hit Resist",
    "pve-attack": "PvE Attack",
    "pve-defense": "PvE Defense",
    "pve-attack-defense": "PvE Attack + Defense",
    "pve-accuracy": "PvE Accuracy",
    "pve-evasion": "PvE Evasion",
    "pve-accuracy-evasion": "PvE Accuracy + Evasion",
    "boss-attack": "Boss Attack",
    "boss-defense": "Boss Defense",
    "boss-attack-defense": "Boss Attack + Defense",
    "ariel-max-hp": "Max HP",
    "ariel-max-mp": "Max MP",
}

export const ARIEL_STAT_TOOLTIPS: Record<ArielStatType, string> = {
    "pve-damage-boost": "PvE Damage Boost +1.5%",
    "pve-damage-tolerance": "PvE Damage Tolerance +1.5%",
    "boss-damage-boost": "Boss Damage Boost +1%",
    "boss-damage-tolerance": "Boss Damage Tolerance +1%",
    "ariel-critical-hit": "Critical Hit +10",
    "ariel-critical-hit-resist": "Critical Hit Resist +10",
    "pve-attack": "PvE Attack +3",
    "pve-defense": "PvE Defense +30",
    "pve-attack-defense": "PvE Attack +3\nPvE Defense +30",
    "pve-accuracy": "PvE Accuracy +5",
    "pve-evasion": "PvE Evasion +5",
    "pve-accuracy-evasion": "PvE Accuracy +5\nPvE Evasion +5",
    "boss-attack": "Boss Attack +3",
    "boss-defense": "Boss Defense +30",
    "boss-attack-defense": "Boss Attack +3\nBoss Defense +30",
    "ariel-max-hp": "Max HP +100",
    "ariel-max-mp": "Max MP +50",
}

// Any stat a board node can give.
export type BoardStat = StatType | ArielStatType

export const BOARD_STAT_NAMES: Record<BoardStat, string> = {
    ...STAT_NAMES,
    ...ARIEL_STAT_NAMES,
}

export const BOARD_STAT_TOOLTIPS: Record<BoardStat, string> = {
    ...STAT_TOOLTIPS,
    ...ARIEL_STAT_TOOLTIPS,
}
