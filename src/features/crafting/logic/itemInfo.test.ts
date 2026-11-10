import { describe, expect, it } from "vitest"
import {
    INGOT,
    makeCraftingData,
    makeSettings,
    ORE,
} from "@test/craftingFixture"
import { describeItemPrice, describeItemSource } from "./itemInfo"

const data = makeCraftingData()

describe("item info", () => {
    it("says how an item is had", () => {
        expect(describeItemSource(data, ORE)).toBe("Gathered or bought")
        expect(describeItemSource(data, INGOT)).toBe(
            "Blacksmithing Novice Lv. 25",
        )
    })

    it("gives its price, or says there's none", () => {
        expect(
            describeItemPrice(
                data,
                makeSettings({ prices: { [ORE]: 12 } }),
                ORE,
            ),
        ).toBe("12 Kinah each")
        expect(describeItemPrice(data, makeSettings(), ORE)).toBe(
            "No price set",
        )
        expect(
            describeItemPrice(
                data,
                makeSettings({ marketPrices: { [ORE]: 15 } }),
                ORE,
            ),
        ).toBe("15 Kinah each on the market")
    })
})
