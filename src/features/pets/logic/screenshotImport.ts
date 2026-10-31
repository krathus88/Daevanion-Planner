import type { Pet } from "@pets/data/petAtlas"
import { getPetLevel, getPetSouls } from "@pets/logic/petLevels"

// Below this a card's best portrait match is too weak to count.
const MIN_SCORE = 0.4
// Below this the match is listed for the user to check.
const SURE_SCORE = 0.65

// One pet card read from a screenshot.
export type CardReading = {
    // The pet whose portrait matched best.
    petId: number
    // Pet Insight level; 0 is locked.
    level: number
    // Total souls.
    souls: number
    // The counter on the card didn't read clearly.
    soulsUnsure: boolean
    score: number
    // Data URL of the card, shown in the review list.
    thumbnail: string
}

export type ImportChange = {
    pet: Pet
    level: number
    current: number
    // Total souls read, and saved now.
    souls: number
    currentSouls: number
    thumbnail: string
    // The portrait matched weakly.
    unsure: boolean
    // The counter on the card didn't read clearly.
    soulsUnsure: boolean
}

export type ImportSummary = {
    changes: ImportChange[]
    // Pets read at the souls they already have.
    unchanged: number
    // Cards no portrait matched.
    unknown: number
}

// Pets in several screenshots keep their best-matched card. The changes list
// the most souls first, like the game's grid, whatever order the screenshots
// came in; equal pets stay in screenshot order. Pets missing from every
// screenshot are left alone.
export const summarizeImport = (
    readings: CardReading[],
    pets: Pet[],
    levels: Record<string, number>,
    souls: Record<string, number>,
): ImportSummary => {
    const petsById = new Map(pets.map((pet) => [pet.id, pet]))
    // A Map keeps a pet's first position when its card is replaced.
    const best = new Map<number, CardReading>()
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

    const changes: ImportChange[] = []
    let unchanged = 0

    for (const [petId, reading] of best) {
        const pet = petsById.get(petId)

        if (!pet) continue

        const current = getPetLevel(levels, pet.id)
        const currentSouls = getPetSouls(levels, souls, pet.id)

        if (reading.souls === currentSouls) {
            unchanged++
            continue
        }

        changes.push({
            pet: pet,
            level: reading.level,
            current: current,
            souls: reading.souls,
            currentSouls: currentSouls,
            thumbnail: reading.thumbnail,
            unsure: reading.score < SURE_SCORE,
            soulsUnsure: reading.soulsUnsure,
        })
    }

    // By what was read, so a correction doesn't move a tile.
    changes.sort((a, b) => b.souls - a.souls)

    return {
        changes: changes,
        unchanged: unchanged,
        unknown: unknown,
    }
}
