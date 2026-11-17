import { describe, expect, it } from "vitest"
import {
    INGOT,
    makeCraftingData,
    ORE,
    SOLVENT,
    SPLENDENT_SWORD,
    SWORD,
} from "@test/craftingFixture"
import { getPlanItemIds, getTreeItemIds, pickOwned } from "./planItems"

const data = makeCraftingData()

describe("getPlanItemIds", () => {
    it("lists the whole recipe tree and the item's combo procs", () => {
        expect(getPlanItemIds(data, SWORD)).toEqual(
            [ORE, SOLVENT, INGOT, SWORD, SPLENDENT_SWORD].sort((a, b) => a - b),
        )
    })

    it("leaves out bound items", () => {
        const transfer = makeCraftingData([
            { id: 41, transfer: true, materials: [[ORE, 1]] },
        ])

        expect(getPlanItemIds(transfer, 41)).toEqual([ORE])
    })

    it("asks for a proc as sold, not the bound transfer it skips", () => {
        // A Splendent Sword the game also lists as a transfer from a Sword.
        const skipping = makeCraftingData(
            [
                { id: SWORD, materials: [[ORE, 5]] },
                {
                    id: 21,
                    materials: [[ORE, 5]],
                    combo: { base: SWORD, chance: 25, only: true },
                },
                { id: 22, transfer: true, materials: [[SWORD, 1]] },
            ],
            [
                [ORE, "Ore", "common"],
                [SWORD, "Sword", "rare"],
                [21, "Splendent Sword", "epic"],
                [22, "Splendent Sword", "epic"],
            ],
        )

        expect(getPlanItemIds(skipping, SWORD)).toEqual([ORE, SWORD, 21])
    })
})

describe("getTreeItemIds", () => {
    it("keeps bound items too: their bag counts still count", () => {
        const transfer = makeCraftingData([
            { id: 41, transfer: true, materials: [[ORE, 1]] },
        ])

        expect(getTreeItemIds(transfer, 41)).toEqual([ORE, 41])
    })
})

describe("pickOwned", () => {
    it("keeps only the tree's counts", () => {
        expect(pickOwned({ [ORE]: 3, 999: 5 }, [ORE, INGOT])).toEqual({
            [ORE]: 3,
        })
    })

    it("hands back the same object while the tree's counts stay the same", () => {
        const first = pickOwned({ [ORE]: 3, 999: 5 }, [ORE, INGOT])

        // Something else picked up: the plan's counts are the same object.
        expect(pickOwned({ [ORE]: 3, 999: 6, 1000: 1 }, [ORE, INGOT])).toBe(
            first,
        )
        expect(pickOwned({ [ORE]: 4, 999: 6 }, [ORE, INGOT])).toEqual({
            [ORE]: 4,
        })
    })
})
