import { describe, expect, it } from "vitest"
import { makeCraftingData } from "@test/craftingFixture"
import { groupRecipeEntries } from "./recipeGroups"
import { getRecipeEntries } from "./recipeList"

const data = makeCraftingData(
    [
        { id: 11, category: "longsword", mastery: 3, materials: [[1, 1]] },
        { id: 12, category: "longsword", mastery: 15, materials: [[1, 1]] },
        { id: 31, category: "greatsword", mastery: 3, materials: [[1, 1]] },
        {
            id: 41,
            profession: "cooking",
            mastery: 1,
            materials: [[1, 1]],
        },
    ],
    [
        [1, "Ore", "common"],
        [11, "Sword", "common"],
        [12, "Expert's Sword", "rare"],
        [31, "Greatsword", "common"],
        [41, "Tea", "common"],
    ],
)

describe("groupRecipeEntries", () => {
    it("puts each tab's run of recipes under its name", () => {
        const groups = groupRecipeEntries(getRecipeEntries(data, "elyos"))

        expect(
            groups.map((group) => {
                return {
                    title: group.title,
                    profession: group.profession,
                    ids: group.entries.map((entry) => entry.item.id),
                }
            }),
        ).toEqual([
            { title: "Greatsword", profession: "Blacksmithing", ids: [31] },
            { title: "Longsword", profession: "Blacksmithing", ids: [11, 12] },
            { title: "Other", profession: "Cooking", ids: [41] },
        ])
    })
})
