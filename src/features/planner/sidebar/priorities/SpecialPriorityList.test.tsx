import { renderHook, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { useHighlightedStat } from "@planner/hooks/useStatHighlight"
import { readSpecialSkips } from "@planner/storage/specialPriorities"
import { renderWithChakra } from "@test/renderWithChakra"
import { SpecialPriorityList } from "./SpecialPriorityList"

const CLASS = "gladiator"

afterEach(() => {
    localStorage.clear()
})

describe("SpecialPriorityList", () => {
    it("highlights a special node's nodes while its name is hovered", async () => {
        const highlighted = renderHook(() => {
            return useHighlightedStat()
        })
        renderWithChakra(<SpecialPriorityList classId={CLASS} />)

        const name = screen.getByRole("button", { name: "Skip Combat Speed" })

        await userEvent.hover(name)

        // Not at once: the board waits a moment.
        expect(highlighted.result.current).toBeNull()
        await waitFor(
            () => {
                expect(highlighted.result.current).toBe("combat-speed")
            },
            { timeout: 2000 },
        )

        await userEvent.unhover(name)

        expect(highlighted.result.current).toBeNull()
    })

    it("skips a special node, locking its rank, and brings it back", async () => {
        renderWithChakra(<SpecialPriorityList classId={CLASS} />)

        const toggle = screen.getByRole("button", { name: "Skip Combat Speed" })
        const rank = screen.getByLabelText("Combat Speed priority rank")

        expect(toggle).toHaveAttribute("aria-pressed", "false")
        expect(rank).toBeEnabled()

        await userEvent.click(toggle)

        expect(readSpecialSkips(CLASS)).toEqual({ "combat-speed": true })
        expect(toggle).toHaveAttribute("aria-pressed", "true")
        expect(rank).toBeDisabled()

        await userEvent.click(toggle)

        expect(readSpecialSkips(CLASS)).toEqual({})
        expect(rank).toBeEnabled()
    })
})
