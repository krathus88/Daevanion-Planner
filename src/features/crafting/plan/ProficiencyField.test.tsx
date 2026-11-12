import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { ProficiencyField } from "./ProficiencyField"

describe("ProficiencyField", () => {
    it("picks a rank and level", () => {
        renderWithChakra(
            <ProficiencyField
                profession="blacksmithing"
                value={62}
                onChange={vi.fn()}
            />,
        )

        expect(
            screen.getByRole("textbox", { name: "Blacksmithing level" }),
        ).toHaveValue("12")
    })

    it("shows just the game's level while the companion app fills it", () => {
        renderWithChakra(
            <ProficiencyField
                profession="blacksmithing"
                value={62}
                locked
                onChange={vi.fn()}
            />,
        )

        expect(screen.queryByRole("textbox")).toBeNull()
        expect(screen.getByText("Professional Lv. 12")).toBeInTheDocument()
        expect(
            screen.getByRole("img", { name: "Filled by the companion app" }),
        ).toBeInTheDocument()
    })
})
