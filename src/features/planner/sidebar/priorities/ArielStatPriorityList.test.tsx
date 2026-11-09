import { renderHook, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { useHighlightedStat } from "@planner/hooks/useStatHighlight"
import { readArielSettings } from "@planner/storage/arielSettings"
import { renderWithChakra } from "@test/renderWithChakra"
import { ArielStatPriorityList } from "./ArielStatPriorityList"

const CLASS = "gladiator"

// jsdom has none; the segment indicator measures its item with one.
class NoResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
}

beforeAll(() => {
    vi.stubGlobal("ResizeObserver", NoResizeObserver)
})

afterEach(() => {
    localStorage.clear()
})

describe("ArielStatPriorityList", () => {
    it("ignores a stat by its name and brings it back, keeping its tier", async () => {
        renderWithChakra(
            <ArielStatPriorityList
                classId={CLASS}
                stats={["pve-attack", "boss-attack"]}
            />,
        )

        const name = screen.getByRole("button", { name: "Ignore PvE Attack" })
        const picker = screen.getByRole("radiogroup", {
            name: "Ariel PvE Attack priority",
        })
        const tier = readArielSettings(CLASS).tiers["pve-attack"]

        await userEvent.click(name)

        expect(readArielSettings(CLASS).ignored).toContain("pve-attack")
        expect(name).toHaveAttribute("aria-pressed", "true")
        expect(picker).toHaveAttribute("data-disabled")
        // No tier shows as picked while ignored.
        expect(picker.querySelector("[data-state='checked']")).toBeNull()

        await userEvent.click(name)

        expect(picker.querySelector("[data-state='checked']")).not.toBeNull()

        expect(readArielSettings(CLASS).ignored).not.toContain("pve-attack")
        expect(readArielSettings(CLASS).tiers["pve-attack"]).toBe(tier)
    })

    it("offers no Ignore tier", () => {
        renderWithChakra(
            <ArielStatPriorityList classId={CLASS} stats={["pve-attack"]} />,
        )

        expect(screen.queryByText("Ignore")).toBeNull()
    })

    it("highlights a stat's nodes while its name is hovered", async () => {
        const highlighted = renderHook(() => {
            return useHighlightedStat()
        })
        renderWithChakra(
            <ArielStatPriorityList classId={CLASS} stats={["pve-attack"]} />,
        )

        const name = screen.getByRole("button", { name: "Ignore PvE Attack" })

        await userEvent.hover(name)

        // Not at once: the board waits a moment.
        expect(highlighted.result.current).toBeNull()
        await waitFor(
            () => {
                expect(highlighted.result.current).toBe("pve-attack")
            },
            { timeout: 2000 },
        )

        await userEvent.unhover(name)

        expect(highlighted.result.current).toBeNull()
    })
})
