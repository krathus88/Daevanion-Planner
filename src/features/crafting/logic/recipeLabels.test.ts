import { describe, expect, it } from "vitest"
import {
    makeCraftingData,
    makeRecipe,
    SPLENDENT_SWORD,
    SWORD,
} from "@test/craftingFixture"
import {
    describeRecipe,
    formatMastery,
    formatShortMastery,
} from "./recipeLabels"

const data = makeCraftingData()

const describeId = (id: number) => {
    const recipe = data.recipes.get(id)

    if (!recipe) {
        throw new Error(`No recipe ${id} in the fixture.`)
    }

    return describeRecipe(data, recipe)
}

describe("formatMastery", () => {
    it("counts levels 1-50 within each rank, like the game", () => {
        expect(formatMastery(1)).toBe("Novice Lv. 1")
        expect(formatMastery(50)).toBe("Novice Lv. 50")
        expect(formatMastery(60)).toBe("Professional Lv. 10")
        expect(formatMastery(101)).toBe("Rank 3 Lv. 1")
    })
})

describe("formatShortMastery", () => {
    it("shortens Professional to Pro", () => {
        expect(formatShortMastery(15)).toBe("Lv. 15")
        expect(formatShortMastery(55)).toBe("Pro 5")
    })
})

describe("describeRecipe", () => {
    it("starts with the item's tab", () => {
        expect(
            describeRecipe(
                data,
                makeRecipe({
                    id: 1,
                    category: "dagger",
                    mastery: 3,
                    materials: [],
                }),
            ),
        ).toBe("Dagger · Blacksmithing Novice Lv. 3")
    })

    it("shows the combo chance on the item crafted", () => {
        expect(describeId(SWORD)).toBe("Blacksmithing Novice Lv. 3 · Combo 25%")
    })

    it("says a Splendent item comes from a combo", () => {
        expect(describeId(SPLENDENT_SWORD)).toBe(
            "Blacksmithing Novice Lv. 3 · Combo item",
        )
        expect(
            describeRecipe(
                data,
                makeRecipe({
                    id: 1,
                    mastery: 75,
                    materials: [],
                    combo: { base: 2, chance: 30, only: false },
                }),
            ),
        ).toBe("Blacksmithing Professional Lv. 25 · Also from combo")
    })
})
