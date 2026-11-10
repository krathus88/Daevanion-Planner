import { describe, expect, it } from "vitest"
import { makeCraftingData } from "@test/craftingFixture"
import { getCraftedFrom } from "./craftedFrom"

// A True Ring is crafted from ore; a Splendent True Ring is transferred from
// it; an Artisan's Splendent Ring procs from an Artisan's Ring and takes an
// Expert's Splendent Ring.
const data = makeCraftingData(
    [
        { id: 10, category: "ring", materials: [[1, 2]] },
        { id: 11, category: "ring", transfer: true, materials: [[10, 1]] },
        {
            id: 12,
            category: "ring",
            transfer: true,
            materials: [
                [11, 1],
                [22, 1],
                [1, 5],
            ],
        },
        { id: 20, category: "ring", materials: [[1, 1]] },
        { id: 21, category: "ring", materials: [[1, 1]] },
        {
            id: 22,
            category: "ring",
            materials: [
                [21, 1],
                [1, 3],
            ],
            combo: { base: 20, chance: 25, only: true },
        },
        { id: 30, category: "materials", materials: [[1, 1]] },
        { id: 31, category: "ring", materials: [[30, 1]] },
    ],
    [
        [1, "Ore", "common"],
        [10, "True Ring", "unique"],
        [11, "Splendent True Ring", "unique"],
        [12, "White Ring", "unique"],
        [20, "Artisan's Ring", "epic"],
        [21, "Expert's Splendent Ring", "epic"],
        [22, "Artisan's Splendent Ring", "unique"],
        [30, "Scale", "common"],
        [31, "Scale Ring", "rare"],
    ],
)

const getNames = (id: number) => {
    const recipe = data.recipes.get(id)

    if (!recipe) {
        throw new Error("The test has this recipe.")
    }

    return getCraftedFrom(data, recipe).map((item) => item.name)
}

describe("getCraftedFrom", () => {
    it("gives one step down", () => {
        expect(getNames(11)).toEqual(["True Ring"])
        // A transfer: the item it upgrades, not other gear it takes.
        expect(getNames(12)).toEqual(["Splendent True Ring"])
        // A combo item: the craft that procs it, not that craft's gear.
        expect(getNames(22)).toEqual(["Artisan's Ring"])
    })

    it("leaves out plain materials", () => {
        expect(getNames(10)).toEqual([])
        expect(getNames(31)).toEqual([])
    })
})
