import { CompanionLockedContext } from "@account/companionLockedContext"
import { screen } from "@testing-library/react"
import { renderWithChakra } from "@test/renderWithChakra"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import { LevelPicker } from "./LevelPicker"
import { SoulProgressField } from "./SoulProgressField"

const renderLocked = (ui: ReactNode, locked: boolean) => {
    return renderWithChakra(
        <CompanionLockedContext value={locked}>{ui}</CompanionLockedContext>,
    )
}

describe("pet fields while the companion app fills them", () => {
    it("shows the souls as a number, not a field", () => {
        // Lv1 starts at 5 souls: 12 total is 7 of 25 towards Lv2.
        renderLocked(<SoulProgressField souls={12} onChange={vi.fn()} />, true)

        expect(
            screen.queryByRole("textbox", {
                name: "Souls towards the next level",
            }),
        ).toBeNull()
        expect(
            screen.getByLabelText("Souls towards the next level: 7 of 25"),
        ).toHaveTextContent("7 / 25")
        expect(
            screen.getByRole("img", { name: "Filled by the companion app" }),
        ).toBeInTheDocument()
    })

    it("keeps the souls field otherwise", () => {
        renderLocked(<SoulProgressField souls={12} onChange={vi.fn()} />, false)

        expect(
            screen.getByRole("textbox", {
                name: "Souls towards the next level",
            }),
        ).toHaveValue("7")
    })

    it("makes the level picker take no input", () => {
        renderLocked(<LevelPicker value={1} onChange={vi.fn()} />, true)

        expect(
            screen
                .getByRole("radiogroup", { name: "Your Insight level" })
                .closest("[inert]"),
        ).not.toBeNull()
    })
})
