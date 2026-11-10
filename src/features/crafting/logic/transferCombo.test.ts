import { describe, expect, it } from "vitest"
import {
    makeCraftingData,
    makeSettings,
    ORE,
    SOLVENT,
} from "@test/craftingFixture"
import { getTransferCombo } from "./transferCombo"

// A White Ring is transferred from Ore; a Splendent White one from a White
// one, 2 Solvent and 1 Ore, unless the White Ring's transfer procs it.
const WHITE = 41
const SPLENDENT = 42
const data = makeCraftingData(
    [
        { id: WHITE, transfer: true, materials: [[ORE, 1]] },
        {
            id: SPLENDENT,
            transfer: true,
            materials: [
                [WHITE, 1],
                [SOLVENT, 2],
                [ORE, 1],
            ],
            combo: { base: WHITE, chance: 25, only: false },
        },
    ],
    [
        [ORE, "Ore", "common"],
        [SOLVENT, "Solvent", "common"],
        [WHITE, "White Ring", "unique"],
        [SPLENDENT, "Splendent White Ring", "unique"],
    ],
)

describe("getTransferCombo", () => {
    it("is worth the next transfer's other materials", () => {
        const combo = getTransferCombo(
            data,
            makeSettings({ prices: { [ORE]: 10, [SOLVENT]: 5 } }),
            WHITE,
            SPLENDENT,
            25,
        )

        expect(combo?.chance).toBe(0.25)
        expect(
            combo?.materials.map((material) => {
                return [material.item.id, material.count]
            }),
        ).toEqual([
            [SOLVENT, 2],
            [ORE, 1],
        ])
        expect(combo?.extraCost).toBe(20)
    })

    it("waits for every price", () => {
        expect(
            getTransferCombo(data, makeSettings(), WHITE, SPLENDENT, 25)
                ?.extraCost,
        ).toBeNull()
    })

    it("needs the Splendent item to be made from this one", () => {
        expect(
            getTransferCombo(data, makeSettings(), 999, SPLENDENT, 25),
        ).toBeNull()
    })
})
