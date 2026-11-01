import { describe, expect, it } from "vitest"
import type { Pet } from "@pets/data/petAtlas"
import { summarizeShop } from "./shopCheck"

const pets = [{ id: 1 }, { id: 2 }, { id: 3 }] as unknown as Pet[]

const reading = (
    petId: number,
    score = 0.9,
    thumbnail = "",
    soldOut = false,
) => {
    return {
        petId: petId,
        score: score,
        soldOut: soldOut,
        thumbnail: thumbnail,
    }
}

describe("summarizeShop", () => {
    it("splits pets below Lv3 from maxed ones", () => {
        const summary = summarizeShop(
            [reading(1), reading(2)],
            pets,
            { 1: 2, 2: 3 },
            {},
            {},
        )

        expect(summary.needed.map((item) => item.pet.id)).toEqual([1])
        expect(summary.maxed.map((item) => item.pet.id)).toEqual([2])
    })

    it("counts weak matches as unknown", () => {
        const summary = summarizeShop([reading(1, 0.69)], pets, {}, {}, {})

        expect(summary.needed).toEqual([])
        expect(summary.unknown).toBe(1)
    })

    it("keeps screenshot order and the best card of a repeat", () => {
        const summary = summarizeShop(
            [reading(2, 0.8, "weak"), reading(1), reading(2, 0.95, "strong")],
            pets,
            {},
            {},
            {},
        )

        expect(summary.needed.map((item) => item.pet.id)).toEqual([2, 1])
        expect(summary.needed[0].thumbnail).toBe("strong")
    })

    it("skips ids it has no pet for", () => {
        expect(summarizeShop([reading(99)], pets, {}, {}, {}).needed).toEqual(
            [],
        )
    })

    it("lists sold-out pets on their own, whatever their level", () => {
        const summary = summarizeShop(
            [reading(1, 0.9, "", true), reading(2, 0.9, "", true), reading(3)],
            pets,
            { 2: 3 },
            {},
            {},
        )

        expect(summary.soldOut.map((item) => item.pet.id)).toEqual([1, 2])
        expect(summary.needed.map((item) => item.pet.id)).toEqual([3])
        expect(summary.maxed).toEqual([])
    })

    it("counts a weak sold-out card as unknown", () => {
        const summary = summarizeShop(
            [reading(1, 0.4, "", true)],
            pets,
            {},
            {},
            {},
        )

        expect(summary.soldOut).toEqual([])
        expect(summary.unknown).toBe(1)
    })

    it("keeps a pet bought up to Lv3 in the needed list", () => {
        const summary = summarizeShop(
            [reading(1)],
            pets,
            { 1: 3 },
            { 1: 105 },
            { 1: 100 },
        )

        expect(summary.needed).toHaveLength(1)
        expect(summary.needed[0]).toMatchObject({
            level: 3,
            souls: 105,
            soulsBefore: 100,
        })
    })
})
