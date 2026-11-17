import { describe, expect, it } from "vitest"
import { makeRecipe, ORE } from "@test/craftingFixture"
import {
    describeBlocked,
    describeOddsHint,
    formatFinish,
} from "./summaryLabels"

const MACE = makeRecipe({ id: 1, mastery: 55, materials: [[ORE, 1]] })
const SPLENDENT = makeRecipe({
    id: 2,
    materials: [[ORE, 1]],
    combo: { base: 1, chance: 25, only: true },
})

describe("formatFinish", () => {
    it("rounds to two decimals", () => {
        expect(formatFinish(0.943356)).toBe("94.34%")
        expect(formatFinish(0.762)).toBe("76.2%")
    })

    it("never rounds up to 100%", () => {
        expect(formatFinish(0.999999)).toBe("99.99%")
        expect(formatFinish(1)).toBe("100%")
    })
})

describe("describeOddsHint", () => {
    it("says nothing for the game's table at your proficiency", () => {
        expect(
            describeOddsHint(MACE, {
                value: 76.2,
                source: "table",
                difference: 4,
            }),
        ).toBeNull()
        expect(
            describeOddsHint(MACE, {
                value: 50,
                source: "manual",
                difference: null,
            }),
        ).toBeNull()
    })

    it("says a missing proficiency counts as 100%", () => {
        expect(
            describeOddsHint(MACE, {
                value: 100,
                source: "unknown",
                difference: null,
            }),
        ).toBe("Success counts as 100% until your proficiency is set.")
    })

    it("says a combo-only item's chances count its combo", () => {
        expect(
            describeOddsHint(SPLENDENT, {
                value: 80,
                source: "table",
                difference: 0,
            }),
        ).toBe("These count the 25% combo too.")
    })
})

describe("describeBlocked", () => {
    it("says the level a recipe needs above your proficiency", () => {
        expect(
            describeBlocked(MACE, {
                value: 67.5,
                source: "table",
                difference: -54,
            }),
        ).toBe(
            "You can't craft this yet: it needs Blacksmithing Professional Lv. 5.",
        )
    })

    it("is null once your proficiency reaches it, or isn't set", () => {
        expect(
            describeBlocked(MACE, {
                value: 67.5,
                source: "table",
                difference: 0,
            }),
        ).toBeNull()
        expect(
            describeBlocked(MACE, {
                value: 100,
                source: "unknown",
                difference: null,
            }),
        ).toBeNull()
    })
})
