import { describe, expect, it } from "vitest"
import { buildCraftingData } from "@crafting/data/craftingData"
import { makeRecipe, makeSettings } from "@test/craftingFixture"
import {
    describeSuccess,
    formatPercent,
    formatSuccess,
    getSuccessInfo,
    getTableChance,
} from "./successChance"

// One table: 70% at the recipe's level, 80% one above, 90% from two above.
const data = buildCraftingData({
    fetched: "2026-11-10",
    chanceTables: [[70, 80, 90]],
    items: [[1, "Sword", "common"]],
    recipes: [
        makeRecipe({ id: 1, mastery: 30, chances: 0, materials: [[2, 1]] }),
    ],
})
const sword = data.recipes.get(1) ?? makeRecipe({ id: 1, materials: [] })

describe("getTableChance", () => {
    it("holds the last value past the end, the first below 0", () => {
        expect(getTableChance([70, 80, 90], 1)).toBe(80)
        expect(getTableChance([70, 80, 90], 40)).toBe(90)
        expect(getTableChance([70, 80, 90], -3)).toBe(70)
    })
})

describe("getSuccessInfo", () => {
    it("reads the table at your proficiency", () => {
        const info = getSuccessInfo(
            data,
            makeSettings({ proficiency: { blacksmithing: 31 } }),
            sword,
        )

        expect(info).toEqual({ value: 80, source: "table", difference: 1 })
    })

    it("lets a percent set by hand win", () => {
        const info = getSuccessInfo(
            data,
            makeSettings({
                proficiency: { blacksmithing: 31 },
                success: { 1: 55 },
            }),
            sword,
        )

        expect(info).toMatchObject({ value: 55, source: "manual" })
    })

    it("counts 100% without a proficiency or table", () => {
        expect(getSuccessInfo(data, makeSettings(), sword)).toMatchObject({
            value: 100,
            source: "unknown",
        })
    })

    it("always succeeds at Transfer Crafting", () => {
        const transfer = makeRecipe({ id: 1, transfer: true, materials: [] })

        expect(
            getSuccessInfo(
                data,
                makeSettings({ success: { 1: 10 } }),
                transfer,
            ),
        ).toMatchObject({ value: 100, source: "transfer" })
    })
})

describe("describeSuccess", () => {
    it("says where the chance comes from", () => {
        expect(
            describeSuccess(
                { value: 90.676961, source: "table", difference: 37 },
                sword,
            ),
        ).toBe(
            "90.68% success from the game's Crafting Chance table, 37 levels above the recipe.",
        )
        expect(
            describeSuccess(
                { value: 70, source: "table", difference: -2 },
                sword,
            ),
        ).toBe(
            "Your Blacksmithing proficiency is below this recipe's level, so the game won't let you craft it yet.",
        )
        expect(
            describeSuccess(
                { value: 100, source: "unknown", difference: null },
                sword,
            ),
        ).toBe(
            "Set your Blacksmithing proficiency to use the game's Crafting Chance table; until then it counts as 100%.",
        )
    })

    it("shows a dash while unknown or below the recipe's level", () => {
        const settings = (blacksmithing: number) => {
            return makeSettings({
                proficiency: { blacksmithing: blacksmithing },
            })
        }

        expect(formatSuccess(getSuccessInfo(data, settings(31), sword))).toBe(
            "80%",
        )
        expect(formatSuccess(getSuccessInfo(data, settings(28), sword))).toBe(
            "—",
        )
        expect(formatSuccess(getSuccessInfo(data, makeSettings(), sword))).toBe(
            "—",
        )
    })

    it("formats percents to two places", () => {
        expect(formatPercent(91.865563)).toBe("91.87%")
        expect(formatPercent(100)).toBe("100%")
    })
})
