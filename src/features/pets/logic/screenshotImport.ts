import type { Pet } from "@pets/data/petAtlas"
import { getPetLevel } from "@pets/logic/petLevels"

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
    score: number
    // Data URL of the card, shown in the review list.
    thumbnail: string
}

export type ImportChange = {
    pet: Pet
    level: number
    current: number
    thumbnail: string
    unsure: boolean
}

export type ImportSummary = {
    changes: ImportChange[]
    // Pets read at the level they already have.
    unchanged: number
    // Cards no portrait matched.
    unknown: number
}

// Pets in several screenshots keep their best-matched card. Pets missing
// from every screenshot are left alone.
export const summarizeImport = (
    readings: CardReading[],
    pets: Pet[],
    levels: Record<string, number>,
): ImportSummary => {
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

    const sure: ImportChange[] = []
    const unsure: ImportChange[] = []
    let unchanged = 0

    for (const pet of pets) {
        const reading = best.get(pet.id)

        if (!reading) continue

        const current = getPetLevel(levels, pet.id)

        if (reading.level === current) {
            unchanged++
            continue
        }

        const change = {
            pet: pet,
            level: reading.level,
            current: current,
            thumbnail: reading.thumbnail,
            unsure: reading.score < SURE_SCORE,
        }

        if (change.unsure) {
            unsure.push(change)
        } else {
            sure.push(change)
        }
    }

    return {
        changes: [...unsure, ...sure],
        unchanged: unchanged,
        unknown: unknown,
    }
}
