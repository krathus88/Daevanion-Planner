import { describe, expect, it } from "vitest"
import { makeCraftingSettings } from "@test/craftingFixture"
import {
    getFavoriteSections,
    getFavoritesKey,
    getSectionKey,
} from "./favorites"

describe("favorites", () => {
    it("keeps them per character on its server, or shared with none", () => {
        expect(getFavoritesKey(makeCraftingSettings())).toBe("")
        expect(
            getFavoritesKey(makeCraftingSettings({ character: "Kryx" })),
        ).toBe("siel/Kryx")
    })

    it("names a section with its window", () => {
        expect(getSectionKey("transfer", "blacksmithing:mace")).toBe(
            "transfer/blacksmithing:mace",
        )
    })

    it("gives the character's starred sections of one window", () => {
        const settings = makeCraftingSettings({
            character: "Kryx",
            favorites: {
                "": ["crafting/cooking:food"],
                "siel/Kryx": [
                    "crafting/blacksmithing:mace",
                    "transfer/blacksmithing:mace",
                    "crafting/blacksmithing:guard",
                ],
            },
        })

        expect(getFavoriteSections(settings, "crafting")).toEqual([
            "blacksmithing:mace",
            "blacksmithing:guard",
        ])
        expect(getFavoriteSections(settings, "transfer")).toEqual([
            "blacksmithing:mace",
        ])
    })
})
