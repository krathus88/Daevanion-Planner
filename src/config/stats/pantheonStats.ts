// What one point of each Pantheon stat gives, from the global client via
// aion2data.com. Keyed by the stat's in-game name.
type PantheonEffect = {
    // Shortened for the loot tooltips.
    name: string
    // Percent per point; negative where the stat lowers it, e.g. cooldowns.
    perPoint: number
}

export const PANTHEON_STATS: Record<string, readonly PantheonEffect[]> = {
    "Justice [Nezekan]": [
        { name: "Defense", perPoint: 0.1 },
        { name: "Perfect", perPoint: 0.1 },
    ],
    "Destruction [Zikel]": [
        { name: "Attack", perPoint: 0.1 },
        { name: "Perfect Resist", perPoint: 0.1 },
    ],
    "Freedom [Vaizel]": [
        { name: "Accuracy", perPoint: 0.1 },
        { name: "Evasion", perPoint: 0.1 },
    ],
    "Death [Triniel]": [
        { name: "Crit", perPoint: 0.1 },
        { name: "Regen Pen", perPoint: 0.1 },
    ],
    "Illusion [Kaisinel]": [
        { name: "Cooldown", perPoint: -0.1 },
        { name: "Endurance Pen", perPoint: 0.1 },
    ],
    "Wisdom [Lumiel]": [
        { name: "MP Cost", perPoint: -0.1 },
        { name: "Double", perPoint: 0.1 },
    ],
    "Life [Yustiel]": [
        { name: "HP", perPoint: 0.1 },
        { name: "Regen", perPoint: 0.1 },
    ],
    "Destiny [Marchutan]": [
        { name: "MP", perPoint: 0.1 },
        { name: "Endurance", perPoint: 0.1 },
    ],
    "Time [Siel]": [
        { name: "Combat Speed", perPoint: 0.1 },
        { name: "Double Resist", perPoint: 0.1 },
    ],
    "Space [Israphel]": [
        { name: "Move Speed", perPoint: 0.1 },
        { name: "Block", perPoint: 0.1 },
    ],
}
