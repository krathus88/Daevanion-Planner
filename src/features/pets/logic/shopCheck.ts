import type { Pet } from "@pets/data/petAtlas"
import {
    getPetLevel,
    getPetSouls,
    levelFromSouls,
    MAX_PET_LEVEL,
} from "@pets/logic/petLevels"

// Pets' art matches their portrait at 0.8 or more. Other items share the
// Special tab, and their art can still reach about 0.6 against some pet.
const MIN_SCORE = 0.7

// One pet card read from a screenshot of the game Shop.
export type ShopReading = {
    // The pet whose portrait matched best.
    petId: number
    score: number
    // Data URL of the card's art, shown in the results.
    thumbnail: string
}

export type ShopPet = {
    pet: Pet
    // The level and total souls saved on this page; 0 is locked.
    level: number
    souls: number
    // Total souls before this check's purchases, so buying a pet up to Lv3
    // doesn't move it to the other list.
    soulsBefore: number
    thumbnail: string
}

export type ShopSummary = {
    // Below Insight Lv3.
    needed: ShopPet[]
    maxed: ShopPet[]
    // Cards that aren't pets, or no portrait matched.
    unknown: number
}

// Every pet on sale once, in screenshot order, against the levels saved on
// this page.
export const summarizeShop = (
    readings: ShopReading[],
    pets: Pet[],
    levels: Record<string, number>,
    souls: Record<string, number>,
    // Pets flagged as bought in this check, with their souls before.
    bought: Record<string, number>,
): ShopSummary => {
    const petsById = new Map(pets.map((pet) => [pet.id, pet]))
    // A Map keeps a pet's first position when its card is replaced.
    const best = new Map<number, ShopReading>()
    let unknown = 0

    for (const reading of readings) {
        if (reading.score < MIN_SCORE) {
            unknown++
            continue
        }

        const kept = best.get(reading.petId)

        if (!kept || reading.score > kept.score) {
            best.set(reading.petId, reading)
        }
    }

    const needed: ShopPet[] = []
    const maxed: ShopPet[] = []

    for (const [petId, reading] of best) {
        const pet = petsById.get(petId)

        if (!pet) continue

        const current = getPetSouls(levels, souls, pet.id)
        const shopPet = {
            pet: pet,
            level: getPetLevel(levels, pet.id),
            souls: current,
            soulsBefore: bought[pet.id] ?? current,
            thumbnail: reading.thumbnail,
        }

        if (levelFromSouls(shopPet.soulsBefore) < MAX_PET_LEVEL) {
            needed.push(shopPet)
        } else {
            maxed.push(shopPet)
        }
    }

    return { needed: needed, maxed: maxed, unknown: unknown }
}
