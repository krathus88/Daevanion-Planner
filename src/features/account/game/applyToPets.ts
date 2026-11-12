import {
    getLevelStart,
    MAX_PET_LEVEL,
    MAX_PET_SOULS,
} from "@pets/logic/petLevels"
import type { PetCollection } from "@pets/storage/petCollection"
import type { GameSnapshot } from "./gameSnapshot"

// Pets are shared by the account: the newest pet list wins as a whole.
export const applyToPets = (
    collection: PetCollection,
    snapshot: GameSnapshot,
): PetCollection => {
    if (snapshot.pets === undefined) {
        return collection
    }

    const levels: Record<string, number> = {}
    const souls: Record<string, number> = {}

    for (const [id, [level, progress]] of Object.entries(snapshot.pets)) {
        if (level < 0 || level > MAX_PET_LEVEL) {
            continue
        }

        // The game counts souls from the level's start; the site keeps totals.
        const total = Math.min(MAX_PET_SOULS, getLevelStart(level) + progress)

        if (level > 0) {
            levels[id] = level
        }

        if (total > 0) {
            souls[id] = total
        }
    }

    return { ...collection, levels: levels, souls: souls }
}
