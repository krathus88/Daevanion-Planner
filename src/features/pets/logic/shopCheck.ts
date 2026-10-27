import type { Pet } from "@pets/data/petAtlas"
import { getPetLevel, MAX_PET_LEVEL } from "@pets/logic/petLevels"

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
    // The level saved on this page; 0 is locked.
    level: number
    thumbnail: string
}

export type ShopSummary = {
    // Below Insight Lv3, lowest level first.
    needed: ShopPet[]
    maxed: ShopPet[]
    // Cards that aren't pets, or no portrait matched.
    unknown: number
}

// Every pet on sale once, against the levels saved on this page.
export const summarizeShop = (
    readings: ShopReading[],
    pets: Pet[],
    levels: Record<string, number>,
): ShopSummary => {
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

    for (const pet of pets) {
        const reading = best.get(pet.id)

        if (!reading) continue

        const shopPet = {
            pet: pet,
            level: getPetLevel(levels, pet.id),
            thumbnail: reading.thumbnail,
        }

        if (shopPet.level < MAX_PET_LEVEL) {
            needed.push(shopPet)
        } else {
            maxed.push(shopPet)
        }
    }

    needed.sort((a, b) => a.level - b.level)

    return { needed: needed, maxed: maxed, unknown: unknown }
}
