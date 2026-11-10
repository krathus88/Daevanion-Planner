import { describe, expect, it } from "vitest"
import {
    INGOT,
    makeCraftingData,
    ORE,
    SOLVENT,
    SPLENDENT_SWORD,
    SWORD,
} from "@test/craftingFixture"
import { getPlanItemIds } from "./planItems"

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
})
