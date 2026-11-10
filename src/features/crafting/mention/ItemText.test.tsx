import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PlanContext } from "@crafting/context/planContext"
import { getItem } from "@crafting/data/craftingData"
import { makeCraftingData, makeSettings, ORE } from "@test/craftingFixture"
import { renderWithChakra } from "@test/renderWithChakra"
import { ItemText } from "./ItemText"

const data = makeCraftingData()

describe("ItemText", () => {
    it("highlights items, with their card on hover", async () => {
        renderWithChakra(
            <PlanContext.Provider
                value={{
                    data: data,
                    settings: makeSettings({ prices: { [ORE]: 12 } }),
                }}
            >
                <ItemText parts={["Needs ", getItem(data, ORE), " first."]} />
            </PlanContext.Provider>,
        )

        await userEvent.hover(screen.getByText("Ore"))

        expect(await screen.findByText("Gathered or bought")).toBeVisible()
        expect(screen.getByText("12 Kinah each")).toBeVisible()
    })
})
