import { describe, expect, it } from "vitest"
import type { Pet } from "@pets/data/petAtlas"
import { summarizeImport, type CardReading } from "./screenshotImport"

const pets = [{ id: 1 }, { id: 2 }, { id: 3 }] as unknown as Pet[]

const reading = (
    petId: number,
    souls: number,
    overrides: Partial<CardReading> = {},
): CardReading => {
    return {
        petId: petId,
        level: 1,
        souls: souls,
        soulsUnsure: false,
        score: 0.9,
        thumbnail: "",
        ...overrides,
    }
}

describe("summarizeImport", () => {
    it("lists changes with most souls first", () => {
        const summary = summarizeImport(
            [reading(1, 10), reading(2, 50)],
            pets,
            {},
            {},
        )

        expect(summary.changes.map((change) => change.pet.id)).toEqual([2, 1])
    })

    it("keeps screenshot order for equal souls", () => {
        const summary = summarizeImport(
            [reading(2, 10), reading(1, 10)],
            pets,
            {},
            {},
        )

        expect(summary.changes.map((change) => change.pet.id)).toEqual([2, 1])
    })

    it("counts a pet already at those souls as unchanged", () => {
        const summary = summarizeImport([reading(1, 30)], pets, { 1: 2 }, {})

        expect(summary.changes).toEqual([])
        expect(summary.unchanged).toBe(1)
    })

    it("reports weak cards as unknown", () => {
        const summary = summarizeImport(
            [reading(1, 10, { score: 0.39 })],
            pets,
            {},
            {},
        )

        expect(summary.changes).toEqual([])
        expect(summary.unknown).toBe(1)
    })

    it("flags middling portrait matches and unclear counters", () => {
        const [change] = summarizeImport(
            [reading(1, 10, { score: 0.5, soulsUnsure: true })],
            pets,
            {},
            {},
        ).changes

        expect(change.unsure).toBe(true)
        expect(change.soulsUnsure).toBe(true)
    })

    it("keeps the best card of a pet seen twice", () => {
        const summary = summarizeImport(
            [
                reading(1, 10, { score: 0.5 }),
                reading(1, 40, { score: 0.9 }),
                reading(1, 20, { score: 0.6 }),
            ],
            pets,
            {},
            {},
        )

        expect(summary.changes).toHaveLength(1)
        expect(summary.changes[0].souls).toBe(40)
    })

    it("shows what's saved now next to what was read", () => {
        const [change] = summarizeImport(
            [reading(1, 40, { level: 2 })],
            pets,
            { 1: 1 },
            { 1: 10 },
        ).changes

        expect(change).toMatchObject({
            level: 2,
            current: 1,
            souls: 40,
            currentSouls: 10,
        })
    })

    it("skips ids it has no pet for", () => {
        const summary = summarizeImport([reading(99, 5)], pets, {}, {})

        expect(summary.changes).toEqual([])
        expect(summary.unchanged).toBe(0)
    })
})
