import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
    makeCraftingData,
    makeSettings,
    ORE,
    SOLVENT,
} from "@test/craftingFixture"
import { renderWithChakra } from "@test/renderWithChakra"
import { TransferComboCard } from "./TransferComboCard"

// A White Ring transfer procs a Splendent White one 25% of the time, which
// else takes another transfer: the White Ring, 2 Solvent and 1 Ore.
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

describe("TransferComboCard", () => {
    it("shows what a proc skips, not odds or market prices", () => {
        renderWithChakra(
            <TransferComboCard
                data={data}
                baseId={WHITE}
                settings={makeSettings({ prices: { [ORE]: 10, [SOLVENT]: 5 } })}
                splendentId={SPLENDENT}
                comboChance={25}
            />,
        )

        expect(screen.getByText("Solvent")).toBeVisible()
        // That transfer: 2 x 5 + 1 x 10; 75% of it on average.
        expect(screen.getByText("20 Kinah")).toBeVisible()
        expect(screen.getByText("15 Kinah")).toBeVisible()
        expect(screen.queryByText(/sure of one/)).toBeNull()
        expect(screen.queryByText("Buying one")).toBeNull()
    })
})
