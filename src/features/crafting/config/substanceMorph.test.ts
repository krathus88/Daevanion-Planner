import { describe, expect, it } from "vitest"
import { buildCraftingData } from "@crafting/data/craftingData"
import raw from "@crafting/data/recipes.json"
import { getMorphSource } from "./substanceMorph"

const data = buildCraftingData(raw as Parameters<typeof buildCraftingData>[0])

describe("getMorphSource", () => {
    it("morphs each Odyle into materials of its own rank", () => {
        const mismatched: string[] = []
        let morphable = 0

        for (const item of data.items.values()) {
            const source = getMorphSource(item.id)

            if (source === undefined) {
                continue
            }

            morphable++

            const odyle = data.items.get(source)

            // Each rank of Odyle has its own grade, like its materials.
            if (!odyle?.name.endsWith("Odyle") || odyle.grade !== item.grade) {
                mismatched.push(item.name)
            }
        }

        expect(morphable).toBe(38)
        expect(mismatched).toEqual([])
    })

    it("leaves other materials alone", () => {
        // Refining Stone.
        expect(getMorphSource(610530001)).toBeUndefined()
    })
})
