// The bonus each special node gives. Which node gives which bonus is set per
// board in layouts.ts (`specialNodeBonuses`) and is the same for every class.
export const SPECIAL_BONUS_TYPES = [
    "combat-speed",
    "cooldown-reduction",
    "damage-tolerance",
    "damage-boost",
    "critical-damage-boost",
    "critical-damage-tolerance",
    "multi-hit-resist",
    "multi-hit-chance",
] as const

export type SpecialBonusType = (typeof SPECIAL_BONUS_TYPES)[number]

export const SPECIAL_BONUSES: Record<
    SpecialBonusType,
    { name: string; tooltip: string }
> = {
    "combat-speed": {
        name: "Combat Speed",
        tooltip: "Combat Speed +1.5%",
    },
    "cooldown-reduction": {
        name: "Cooldown Reduction",
        tooltip: "Cooldown Reduction +1.5%",
    },
    "damage-tolerance": {
        name: "Damage Tolerance",
        tooltip: "Damage Tolerance +1.5%",
    },
    "damage-boost": {
        name: "Damage Boost",
        tooltip: "Damage Boost +1.5%",
    },
    "critical-damage-boost": {
        name: "Critical Damage Boost",
        tooltip: "Critical Damage Boost +1.5%",
    },
    "critical-damage-tolerance": {
        name: "Critical Damage Tolerance",
        tooltip: "Critical Damage Tolerance +1.5%",
    },
    "multi-hit-resist": {
        name: "Multi-Hit Resist",
        tooltip: "Multi-Hit Resist +1.5%",
    },
    "multi-hit-chance": {
        name: "Multi-Hit Chance",
        tooltip: "Multi-Hit Chance +1.5%",
    },
}
