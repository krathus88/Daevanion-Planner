import { CompanionLockedContext } from "@account/companionLockedContext"
import { screen } from "@testing-library/react"
import { renderWithChakra } from "@test/renderWithChakra"
import { describe, expect, it, vi } from "vitest"
import { BagCountField } from "./BagCountField"

describe("BagCountField", () => {
    it("is a field to type the bag count in", () => {
        renderWithChakra(<BagCountField owned={12} onChange={vi.fn()} />)

        expect(screen.getByRole("textbox", { name: "In the bag" })).toHaveValue(
            "12",
        )
    })

    it("shows the game's count while the companion app fills it", () => {
        renderWithChakra(
            <CompanionLockedContext value>
                <BagCountField owned={1200} onChange={vi.fn()} />
            </CompanionLockedContext>,
        )

        expect(screen.queryByRole("textbox")).toBeNull()
        expect(screen.getByLabelText("In the bag: 1200")).toBeInTheDocument()
        expect(
            screen.getByRole("img", { name: "Filled by the companion app" }),
        ).toBeInTheDocument()
    })
})
