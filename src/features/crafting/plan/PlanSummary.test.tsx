import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { buildCraftPlan } from "@crafting/logic/craftPlan"
import {
    makeCraftingData,
    makeSettings,
    ORE,
    SOLVENT,
    SWORD,
} from "@test/craftingFixture"
import { renderWithChakra } from "@test/renderWithChakra"
import { PlanSummary } from "./PlanSummary"

const data = makeCraftingData()
const settings = makeSettings({ prices: { [ORE]: 10, [SOLVENT]: 5 } })

const setup = (
    blocked: string | null,
    sellPrice: number | null = 300,
    tradable = true,
    pricesLoading = false,
) => {
    const onSellPriceChange = vi.fn()

    renderWithChakra(
        <PlanSummary
            plan={buildCraftPlan(data, settings, SWORD, 1)}
            attemptCost={125}
            craftsEach={2}
            finishes={[
                { crafts: 1, chance: 0.5 },
                { crafts: 2, chance: 0.75 },
            ]}
            oddsHint={null}
            blocked={blocked}
            count={1}
            sellPrice={sellPrice}
            // Without a sell price, the market has none: its field shows.
            sellPriceState={
                sellPrice === null
                    ? { kind: "own", value: null }
                    : {
                          kind: "listed",
                          price: { value: sellPrice, source: "market" },
                      }
            }
            tradable={tradable}
            pricesLoading={pricesLoading}
            onSellPriceChange={onSellPriceChange}
        />,
    )

    return { onSellPriceChange: onSellPriceChange }
}

describe("PlanSummary", () => {
    it("shows one craft's cost, what's left to buy, the chances and the profit", () => {
        setup(null)

        expect(screen.getByText("125 Kinah")).toBeVisible()
        // 1 Ingot craft (200 + 50) and 5 Ore.
        expect(screen.getByText("300 Kinah")).toBeVisible()
        expect(screen.getByText("75% sure")).toBeVisible()
        expect(screen.getByText("+20 Kinah")).toBeVisible()
    })

    it("says why it can't be crafted yet instead of its chances", () => {
        setup("You can't craft this yet.")

        expect(screen.getByText("125 Kinah")).toBeVisible()
        expect(screen.getByText("You can't craft this yet.")).toBeVisible()
        // What's left to buy still shows.
        expect(screen.getByText("300 Kinah")).toBeVisible()
        expect(screen.queryByText("75% sure")).toBeNull()
        expect(screen.queryByText("+20 Kinah")).toBeNull()
    })

    it("asks what a craftable item sells for when the market has no price", async () => {
        const { onSellPriceChange } = setup(null, null)

        await userEvent.click(screen.getByLabelText("Sells for (Kinah)"))
        await userEvent.paste("300")

        expect(onSellPriceChange).toHaveBeenLastCalledWith(300)
    })

    it("leaves a market price to the profit's hover", () => {
        setup(null)

        expect(screen.queryByLabelText("Sells for (Kinah)")).toBeNull()
    })

    it("asks no sell price of a bound item", () => {
        setup(null, null, false)

        expect(screen.queryByLabelText("Sells for (Kinah)")).toBeNull()
    })

    it("waits for the market for a craftable item's profit", () => {
        setup(null, null, true, true)

        // The two amounts and the profit.
        expect(screen.getAllByLabelText("Loading prices")).toHaveLength(3)
    })

    it("doesn't wait for the market for a bound item", () => {
        setup(null, null, false, true)

        // Only the two amounts.
        expect(screen.getAllByLabelText("Loading prices")).toHaveLength(2)
    })
})
