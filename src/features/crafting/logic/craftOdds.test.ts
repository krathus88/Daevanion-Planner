import { describe, expect, it } from "vitest"
import { makeRecipe, ORE } from "@test/craftingFixture"
import { getFinishChances, getSuccessesNeeded } from "./craftOdds"

describe("getFinishChances", () => {
    it("gives the chance one item is done within 1, 2 and 3 crafts", () => {
        const chances = getFinishChances(0.762, 1)

        expect(chances.map((entry) => entry.crafts)).toEqual([1, 2, 3])
        expect(chances[0].chance).toBeCloseTo(0.762)
        expect(chances[1].chance).toBeCloseTo(1 - 0.238 ** 2)
        expect(chances[2].chance).toBeCloseTo(1 - 0.238 ** 3)
    })

    it("counts several successes", () => {
        // 2 of 3 at 50%: 3 ways with one failure, 1 with none.
        const chances = getFinishChances(0.5, 2)

        expect(chances.map((entry) => entry.crafts)).toEqual([2, 3, 4])
        expect(chances[0].chance).toBeCloseTo(0.25)
        expect(chances[1].chance).toBeCloseTo(0.5)
        // 1 + 4 + 6 of 16.
        expect(chances[2].chance).toBeCloseTo(11 / 16)
    })

    it("has just the one when every craft succeeds", () => {
        expect(getFinishChances(1, 3)).toEqual([{ crafts: 3, chance: 1 }])
    })

    it("stays near 0 for thousands of crafts at a low chance", () => {
        expect(getFinishChances(0.762, 9999)[2].chance).toBeCloseTo(0)
    })
})

describe("getSuccessesNeeded", () => {
    it("needs one success per yield, rounded up", () => {
        const ingot = makeRecipe({ id: 1, yield: 10, materials: [[ORE, 1]] })
        const mace = makeRecipe({ id: 2, materials: [[ORE, 1]] })

        expect(getSuccessesNeeded(ingot, 25)).toBe(3)
        expect(getSuccessesNeeded(mace, 2)).toBe(2)
    })
})
