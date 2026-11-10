import { describe, expect, it } from "vitest"
import {
    isProfessionId,
    PROFESSION_CATEGORIES,
} from "@crafting/config/professions"
import raw from "./recipes.json"
import { buildCraftingData, getItem } from "./craftingData"

const data = buildCraftingData(raw as Parameters<typeof buildCraftingData>[0])

describe("buildCraftingData", () => {
    it("indexes items and recipes by id", () => {
        const ingot = data.recipes.get(610710001)

        expect(getItem(data, 610710001).name).toBe("Orichalcum Ingot")
        expect(ingot).toMatchObject({ profession: "blacksmithing", yield: 10 })
    })

    it("names an item missing from the data by its id", () => {
        expect(getItem(data, 1)).toEqual({ id: 1, name: "Item 1", grade: null })
    })
})

// The generated file (npm run crafting:data) holds together.
describe("recipes.json", () => {
    it("names every material and combo base", () => {
        const missing: number[] = []

        for (const recipe of data.recipes.values()) {
            const ids = [
                recipe.id,
                ...recipe.materials.map(([id]) => id),
                ...(recipe.combo ? [recipe.combo.base] : []),
            ]

            for (const id of ids) {
                if (!data.items.has(id)) {
                    missing.push(id)
                }
            }
        }

        expect(missing).toEqual([])
    })

    it("puts each recipe in one of its profession's tabs", () => {
        const misplaced: number[] = []

        for (const recipe of data.recipes.values()) {
            const categories = PROFESSION_CATEGORIES[recipe.profession]

            // Only Cooking's drinks are in no tab.
            if (
                recipe.category
                    ? !categories.includes(recipe.category)
                    : recipe.profession !== "cooking"
            ) {
                misplaced.push(recipe.id)
            }
        }

        expect(misplaced).toEqual([])
    })

    it("has a level on every recipe but Transfer Crafting's", () => {
        for (const recipe of data.recipes.values()) {
            expect(recipe.mastery === undefined).toBe(recipe.transfer === true)
        }
    })

    it("starts each transfer with the gear it's made from", () => {
        // In game: White Dragon Lord Greatsword from the Splendent True one.
        const white = data.recipes.get(110130095)

        expect(white?.materials[0]).toEqual([110130096, 1])

        for (const recipe of data.recipes.values()) {
            if (recipe.transfer) {
                const [first] = recipe.materials

                expect(data.recipes.get(first[0])?.category).toBe(
                    recipe.category,
                )
            }
        }
    })

    it("lists each name once per faction and window", () => {
        const seen = new Set<string>()
        const repeated: string[] = []

        for (const recipe of data.recipes.values()) {
            if (recipe.combo?.only) {
                continue
            }

            const factions = recipe.faction
                ? [recipe.faction]
                : ["elyos", "asmodians"]

            for (const faction of factions) {
                const key = `${faction}/${recipe.transfer === true}/${getItem(data, recipe.id).name}`

                if (seen.has(key)) {
                    repeated.push(key)
                }

                seen.add(key)
            }
        }

        expect(repeated).toEqual([])
    })

    it("has the game's Crafting Chance table for every crafted recipe", () => {
        const missing = [...data.recipes.values()].filter((recipe) => {
            return !recipe.transfer && recipe.chances === undefined
        })

        expect(missing.map((recipe) => recipe.id)).toEqual([])
    })

    it("matches the in-game Crafting Chance window", () => {
        // Orichalcum Mace (Elyos), checked against the game's window.
        const mace = data.recipes.get(110760023)
        const table =
            mace?.chances === undefined ? [] : data.chanceTables[mace.chances]

        expect(table[37]).toBe(90.676961)
        expect(table[38]).toBe(91.865563)
        expect(table[44]).toBe(93.121326)
    })

    it("gives each faction the same recipes", () => {
        const counts = { elyos: 0, asmodians: 0 }

        for (const recipe of data.recipes.values()) {
            if (recipe.faction) {
                counts[recipe.faction]++
            }
        }

        expect(counts.elyos).toBeGreaterThan(0)
        expect(counts.elyos).toBe(counts.asmodians)
    })

    it("leaves out the quest's profession tools", () => {
        const names = [...data.items.values()].map((item) => item.name)

        // Hammers like Zircon Hammer (Bound) are materials; the tools are
        // the Blacksmith's Hammer and its kin.
        expect(
            names.filter((name) => {
                return /Blacksmith's Hammer|Alchemist's Scale|Chef's Seasoning/.test(
                    name,
                )
            }),
        ).toEqual([])
    })

    it("has whole, positive counts and known professions", () => {
        for (const recipe of data.recipes.values()) {
            expect(isProfessionId(recipe.profession)).toBe(true)
            expect(recipe.yield).toBeGreaterThan(0)
            expect(recipe.materials.length).toBeGreaterThan(0)

            for (const [, count] of recipe.materials) {
                expect(Number.isInteger(count) && count > 0).toBe(true)
            }

            if (recipe.combo) {
                expect(recipe.combo.chance).toBeGreaterThan(0)
                expect(recipe.combo.chance).toBeLessThanOrEqual(100)
            }
        }
    })
})
