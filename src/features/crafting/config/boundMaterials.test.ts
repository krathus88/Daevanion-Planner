import { describe, expect, it } from "vitest"
import { buildCraftingData } from "@crafting/data/craftingData"
import raw from "@crafting/data/recipes.json"
import { BOUND_MATERIALS } from "./boundMaterials"

const data = buildCraftingData(raw as Parameters<typeof buildCraftingData>[0])

describe("BOUND_MATERIALS", () => {
    it("names recipe materials, never items of their own", () => {
        const used = new Set(
            [...data.recipes.values()].flatMap((recipe) => {
                return recipe.materials.map(([id]) => {
                    return id
                })
            }),
        )

        for (const [bound, tradable] of Object.entries(BOUND_MATERIALS)) {
            expect(data.items.has(Number(bound))).toBe(false)
            expect(used.has(Number(tradable))).toBe(true)
        }
    })
})
