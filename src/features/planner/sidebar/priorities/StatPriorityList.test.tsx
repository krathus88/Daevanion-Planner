import { renderHook, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { loadClassPreset, type ClassPreset } from "@config/classPresets"
import { useHighlightedStat } from "@planner/hooks/useStatHighlight"
import { readStatSettings } from "@planner/storage/statPriorities"
import { renderWithChakra } from "@test/renderWithChakra"
import { StatPriorityList } from "./StatPriorityList"

// dnd-kit reads ResizeObserver as it loads, which jsdom lacks.
vi.hoisted(() => {
    vi.stubGlobal(
        "ResizeObserver",
        class {
            observe() {}
            unobserve() {}
            disconnect() {}
        },
    )
})

let preset: ClassPreset

beforeAll(async () => {
    preset = await loadClassPreset("gladiator")
})

afterEach(() => {
    localStorage.clear()
})

const settings = () => {
    return readStatSettings(preset.id)
}

describe("StatPriorityList", () => {
    it("highlights a stat's nodes while its name is hovered", async () => {
        const highlighted = renderHook(() => {
            return useHighlightedStat()
        })
        renderWithChakra(<StatPriorityList classPreset={preset} />)

        const name = screen.getByTitle("Defense")

        await userEvent.hover(name)

        // Not at once: the board waits a moment.
        expect(highlighted.result.current).toBeNull()
        await waitFor(
            () => {
                expect(highlighted.result.current).toBe("defense")
            },
            { timeout: 2000 },
        )

        await userEvent.unhover(name)

        expect(highlighted.result.current).toBeNull()
    })

    it("starts with Max on for Attack and Critical Hit only", () => {
        renderWithChakra(<StatPriorityList classPreset={preset} />)

        const max = (stat: string) => {
            return screen.getByRole("checkbox", { name: `Max ${stat}` })
        }

        expect(max("Attack")).toBeChecked()
        expect(max("Critical Hit")).toBeChecked()
        expect(max("Max HP")).not.toBeChecked()
        expect(max("Defense")).not.toBeChecked()
        expect(max("Critical Hit Resist")).not.toBeChecked()
        expect(
            screen.queryByRole("checkbox", { name: "Max Max MP" }),
        ).toBeNull()
    })

    it("shows Max's ranks only once Max is on, and saves them", async () => {
        renderWithChakra(<StatPriorityList classPreset={preset} />)

        expect(
            screen.queryByLabelText("Max Defense before skills ranked after"),
        ).toBeNull()

        await userEvent.click(
            screen.getByRole("checkbox", { name: "Max Defense" }),
        )

        expect(settings().max.defense.enabled).toBe(true)

        const passiveAfter = screen.getByLabelText(
            "Max Defense before passives ranked after",
        )

        expect(passiveAfter).toHaveValue("5")

        await userEvent.clear(passiveAfter)
        await userEvent.type(passiveAfter, "3")

        expect(settings().max.defense.passiveAfter).toBe(3)
    })

    it("has no ability ranks for Max on This board", async () => {
        renderWithChakra(
            <StatPriorityList classPreset={preset} layout="nezekan" />,
        )

        await userEvent.click(
            screen.getByRole("checkbox", { name: "Max Defense" }),
        )

        expect(settings().max.defense.enabled).toBe(true)
        expect(
            screen.queryByLabelText("Max Defense before skills ranked after"),
        ).toBeNull()
    })

    it("labels only the Ignored box, whose stats have no Max", () => {
        renderWithChakra(<StatPriorityList classPreset={preset} />)

        expect(screen.getByText("Ignored")).toBeInTheDocument()
        expect(screen.queryByText("1")).toBeNull()
        expect(
            screen.getByRole("button", { name: "Drag Max MP" }),
        ).toBeVisible()
        expect(
            screen.queryByRole("checkbox", { name: "Max Max MP" }),
        ).toBeNull()
    })
})
