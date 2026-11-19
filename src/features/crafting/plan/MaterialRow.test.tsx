import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import type { PlanMaterial } from "@crafting/logic/craftPlan"
import { renderWithChakra } from "@test/renderWithChakra"
import { MaterialRow } from "./MaterialRow"

// jsdom has none; the tooltip positions itself with one.
class NoResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
}

beforeAll(() => {
    vi.stubGlobal("ResizeObserver", NoResizeObserver)
})

afterAll(() => {
    vi.unstubAllGlobals()
})

// The user's Radiant Orichalcum Ore (2026-11-19): 9 missing, cheaper as
// Radiant Odyle.
const ORE_MATERIAL: PlanMaterial = {
    item: { id: 1, name: "Radiant Orichalcum Ore", grade: null },
    need: 9,
    owned: 0,
    missing: 9,
    price: 1_099_999,
    cost: 6_999_993,
    morph: {
        item: { id: 2, name: "Radiant Odyle", grade: null },
        price: 777_777,
    },
    craftable: false,
}

const setup = (material: PlanMaterial) => {
    renderWithChakra(
        <MaterialRow
            material={material}
            priceState={{
                kind: "listed",
                price: { value: 1_099_999, source: "market" },
            }}
            crafted={false}
            tradable
            pricesLoading={false}
            owned={0}
            onOwnedChange={vi.fn()}
            onPriceChange={vi.fn()}
            onBoughtChange={vi.fn()}
            onItemSelect={vi.fn()}
        />,
    )
}

describe("MaterialRow", () => {
    it("says on hover a morphed cost is Odyle's, and what buying costs", async () => {
        setup(ORE_MATERIAL)

        await userEvent.hover(screen.getByText("6,999,993"))

        expect(
            await screen.findByText("9× Radiant Orichalcum Ore bought instead"),
        ).toBeVisible()
        expect(screen.getByText("9,899,991")).toBeVisible()
        expect(screen.getByText("Morphing saves")).toBeVisible()
    })

    it("has no hover for a cost at its own price", () => {
        setup({ ...ORE_MATERIAL, cost: 9_899_991, morph: null })

        expect(screen.getByText("9,899,991")).not.toHaveAttribute("tabindex")
    })
})
