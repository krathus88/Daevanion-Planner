import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { buildCraftPlan } from "@crafting/logic/craftPlan"
import { getTreeLines, indexPlan } from "@crafting/logic/craftTree"
import { makeCraftingData, makeSettings, ORE } from "@test/craftingFixture"
import { renderWithChakra } from "@test/renderWithChakra"
import { CraftTreeLine } from "./CraftTreeLine"

// A Ring takes a Splendent Ring, which takes an Expert's Ring made of Ore.
const RING = 30
const SPLENDENT = 20
const EXPERT = 10
const data = makeCraftingData(
    [
        { id: RING, category: "ring", materials: [[SPLENDENT, 1]] },
        { id: SPLENDENT, category: "ring", materials: [[EXPERT, 1]] },
        { id: EXPERT, category: "ring", materials: [[ORE, 2]] },
    ],
    [
        [ORE, "Ore", "common"],
        [EXPERT, "Expert's Ring", "rare"],
        [SPLENDENT, "Splendent Ring", "epic"],
        [RING, "Ring", "unique"],
    ],
)

describe("CraftTreeLine", () => {
    it("opens an item's craft even when the plan doesn't need it", async () => {
        // The Splendent Ring is in the bag, so no Expert's Ring is needed.
        const settings = makeSettings({ owned: { [SPLENDENT]: 1 } })
        const index = indexPlan(buildCraftPlan(data, settings, RING, 1))
        const splendent = data.recipes.get(SPLENDENT)

        if (!splendent) {
            throw new Error("The test has a Splendent Ring recipe.")
        }

        const [line] = getTreeLines(data, settings, index, splendent)
        const onItemSelect = vi.fn()

        renderWithChakra(
            <CraftTreeLine
                data={data}
                line={line}
                settings={settings}
                index={index}
                handlers={{
                    onOwnedChange: vi.fn(),
                    onSuccessChange: vi.fn(),
                    onPriceChange: vi.fn(),
                    onBoughtChange: vi.fn(),
                    onItemSelect: onItemSelect,
                }}
            />,
        )

        await userEvent.click(
            screen.getByRole("button", { name: "Expert's Ring" }),
        )

        expect(line.step).toBeNull()
        expect(onItemSelect).toHaveBeenLastCalledWith(EXPERT)
    })
})
