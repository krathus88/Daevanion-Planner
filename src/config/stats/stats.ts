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

const STAT_TOOLTIPS: Record<StatType, string> = {
    attack: "Attack +3",
    "critical-hit": "Critical Hit +5",
    "max-hp": "Max HP +100",
    defense: "Defense +30",
    "critical-hit-resist": "Critical Hit Resist +5",
    "max-mp": "Max MP +50",
}

// Ariel's node kinds; each gives one or two stats (`ARIEL_NODE_GIVES`).
export type ArielStatType =
    | "pve-damage-boost"
    | "pve-damage-tolerance"
    | "boss-damage-boost"
    | "boss-damage-tolerance"
    | "ariel-critical-hit"
    | "ariel-critical-hit-resist"
    | "pve-attack"
    | "pve-defense"
    | "pve-attack-defense"
    | "pve-accuracy"
    | "pve-evasion"
    | "pve-accuracy-evasion"
    | "boss-attack"
    | "boss-defense"
    | "boss-attack-defense"
    | "ariel-max-hp"
    | "ariel-max-mp"

const ARIEL_STAT_NAMES: Record<ArielStatType, string> = {
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

const ARIEL_STAT_TOOLTIPS: Record<ArielStatType, string> = {
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

// What Ariel's priorities rank: its special nodes, then its stats. A
// combined node (Attack + Defense) gives both of its stats.
export const ARIEL_SPECIAL_STATS = [
    "pve-damage-boost",
    "pve-damage-tolerance",
    "boss-damage-boost",
    "boss-damage-tolerance",
] as const

export const isArielSpecialStat = (stat: string | undefined) => {
    return (
        stat !== undefined &&
        (ARIEL_SPECIAL_STATS as readonly string[]).includes(stat)
    )
}

export const ARIEL_PLAIN_STATS = [
    "pve-attack",
    "pve-accuracy",
    "pve-defense",
    "pve-evasion",
    "boss-attack",
    "boss-defense",
    "ariel-critical-hit",
    "ariel-critical-hit-resist",
    "ariel-max-hp",
    "ariel-max-mp",
] as const

export const ARIEL_PRIORITY_STATS = [
    ...ARIEL_SPECIAL_STATS,
    ...ARIEL_PLAIN_STATS,
] as const

export type ArielPriorityStat = (typeof ARIEL_PRIORITY_STATS)[number]

export const ARIEL_NODE_GIVES: Record<
    ArielStatType,
    readonly ArielPriorityStat[]
> = {
    "pve-damage-boost": ["pve-damage-boost"],
    "pve-damage-tolerance": ["pve-damage-tolerance"],
    "boss-damage-boost": ["boss-damage-boost"],
    "boss-damage-tolerance": ["boss-damage-tolerance"],
    "ariel-critical-hit": ["ariel-critical-hit"],
    "ariel-critical-hit-resist": ["ariel-critical-hit-resist"],
    "pve-attack": ["pve-attack"],
    "pve-defense": ["pve-defense"],
    "pve-attack-defense": ["pve-attack", "pve-defense"],
    "pve-accuracy": ["pve-accuracy"],
    "pve-evasion": ["pve-evasion"],
    "pve-accuracy-evasion": ["pve-accuracy", "pve-evasion"],
    "boss-attack": ["boss-attack"],
    "boss-defense": ["boss-defense"],
    "boss-attack-defense": ["boss-attack", "boss-defense"],
    "ariel-max-hp": ["ariel-max-hp"],
    "ariel-max-mp": ["ariel-max-mp"],
}

// Azphel's node kinds (PvP); each gives one or two stats
// (`AZPHEL_NODE_GIVES`).
export type AzphelStatType =
    | "pvp-damage-boost"
    | "pvp-damage-tolerance"
    | "pvp-attack"
    | "pvp-defense"
    | "pvp-attack-defense"
    | "pvp-accuracy"
    | "pvp-evasion"
    | "pvp-accuracy-evasion"
    | "pvp-critical-hit"
    | "pvp-critical-hit-resist"
    | "pvp-critical-hit-both"
    | "status-effect-chance"
    | "status-effect-resist"
    | "azphel-max-hp"
    | "azphel-max-mp"

const AZPHEL_STAT_NAMES: Record<AzphelStatType, string> = {
    "pvp-damage-boost": "PvP Damage Boost",
    "pvp-damage-tolerance": "PvP Damage Tolerance",
    "pvp-attack": "PvP Attack",
    "pvp-defense": "PvP Defense",
    "pvp-attack-defense": "PvP Attack + Defense",
    "pvp-accuracy": "PvP Accuracy",
    "pvp-evasion": "PvP Evasion",
    "pvp-accuracy-evasion": "PvP Accuracy + Evasion",
    "pvp-critical-hit": "PvP Critical Hit",
    "pvp-critical-hit-resist": "PvP Critical Hit Resist",
    "pvp-critical-hit-both": "PvP Critical Hit + Resist",
    "status-effect-chance": "Status Effect Chance",
    "status-effect-resist": "Status Effect Resist",
    "azphel-max-hp": "Max HP",
    "azphel-max-mp": "Max MP",
}

const AZPHEL_STAT_TOOLTIPS: Record<AzphelStatType, string> = {
    "pvp-damage-boost": "PvP Damage Boost +1.5%",
    "pvp-damage-tolerance": "PvP Damage Tolerance +1.5%",
    "pvp-attack": "PvP Attack +3",
    "pvp-defense": "PvP Defense +30",
    "pvp-attack-defense": "PvP Attack +3\nPvP Defense +30",
    "pvp-accuracy": "PvP Accuracy +5",
    "pvp-evasion": "PvP Evasion +3",
    "pvp-accuracy-evasion": "PvP Accuracy +5\nPvP Evasion +3",
    "pvp-critical-hit": "PvP Critical Hit +5",
    "pvp-critical-hit-resist": "PvP Critical Hit Resist +5",
    "pvp-critical-hit-both": "PvP Critical Hit +5\nPvP Critical Hit Resist +5",
    "status-effect-chance": "Status Effect Chance +100",
    "status-effect-resist": "Status Effect Resist +100",
    "azphel-max-hp": "Max HP +100",
    "azphel-max-mp": "Max MP +50",
}

// What Azphel's priorities rank, like Ariel's.
export const AZPHEL_SPECIAL_STATS = [
    "pvp-damage-boost",
    "pvp-damage-tolerance",
] as const

export const AZPHEL_PLAIN_STATS = [
    "pvp-attack",
    "pvp-accuracy",
    "pvp-critical-hit",
    "status-effect-chance",
    "pvp-defense",
    "pvp-evasion",
    "pvp-critical-hit-resist",
    "status-effect-resist",
    "azphel-max-hp",
    "azphel-max-mp",
] as const

export const AZPHEL_PRIORITY_STATS = [
    ...AZPHEL_SPECIAL_STATS,
    ...AZPHEL_PLAIN_STATS,
] as const

export type AzphelPriorityStat = (typeof AZPHEL_PRIORITY_STATS)[number]

const AZPHEL_NODE_GIVES: Record<
    AzphelStatType,
    readonly AzphelPriorityStat[]
> = {
    "pvp-damage-boost": ["pvp-damage-boost"],
    "pvp-damage-tolerance": ["pvp-damage-tolerance"],
    "pvp-attack": ["pvp-attack"],
    "pvp-defense": ["pvp-defense"],
    "pvp-attack-defense": ["pvp-attack", "pvp-defense"],
    "pvp-accuracy": ["pvp-accuracy"],
    "pvp-evasion": ["pvp-evasion"],
    "pvp-accuracy-evasion": ["pvp-accuracy", "pvp-evasion"],
    "pvp-critical-hit": ["pvp-critical-hit"],
    "pvp-critical-hit-resist": ["pvp-critical-hit-resist"],
    "pvp-critical-hit-both": ["pvp-critical-hit", "pvp-critical-hit-resist"],
    "status-effect-chance": ["status-effect-chance"],
    "status-effect-resist": ["status-effect-resist"],
    "azphel-max-hp": ["azphel-max-hp"],
    "azphel-max-mp": ["azphel-max-mp"],
}

// The stat boards' (Ariel's and Azphel's) node kinds and ranked stats.
export type StatBoardNode = ArielStatType | AzphelStatType
export type StatBoardStat = ArielPriorityStat | AzphelPriorityStat

export const STAT_BOARD_NODE_GIVES: Record<
    StatBoardNode,
    readonly StatBoardStat[]
> = {
    ...ARIEL_NODE_GIVES,
    ...AZPHEL_NODE_GIVES,
}

export const STAT_BOARD_STAT_NAMES: Record<StatBoardStat, string> = {
    ...ARIEL_STAT_NAMES,
    ...AZPHEL_STAT_NAMES,
}

export const isStatBoardNode = (stat: BoardStat): stat is StatBoardNode => {
    return Object.hasOwn(STAT_BOARD_NODE_GIVES, stat)
}

export type BoardStat = StatType | StatBoardNode

export const BOARD_STAT_NAMES: Record<BoardStat, string> = {
    ...STAT_NAMES,
    ...ARIEL_STAT_NAMES,
    ...AZPHEL_STAT_NAMES,
}

export const BOARD_STAT_TOOLTIPS: Record<BoardStat, string> = {
    ...STAT_TOOLTIPS,
    ...ARIEL_STAT_TOOLTIPS,
    ...AZPHEL_STAT_TOOLTIPS,
}
