// Pets whose soul drops from killing them as a dungeon boss. Kept by hand:
// the Pet Atlas has no dungeon data. Keyed by pet id.
export type PetBoss = {
    dungeon: string
    // The boss's name when it differs from the pet's.
    boss?: string
    // Seen in game; false while it's only a guess or fan sites say so.
    confirmed: boolean
}

export const PET_BOSSES: Record<number, PetBoss> = {
    // Red Spark Ignus
    1091: { dungeon: "Fire Temple", confirmed: true },
    // Black Smoke Murute
    1058: { dungeon: "Fire Temple", confirmed: true },
    // Phantasmal Lakshmi
    1093: { dungeon: "Draupnir", confirmed: true },
    // Predator Saraswati
    1215: { dungeon: "Draupnir", confirmed: true },
    // Harcon
    1077: { dungeon: "Krao Cave", boss: "Enhanced Harcon", confirmed: true },
}
