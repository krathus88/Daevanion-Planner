import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { loadClassPreset, type ClassPreset } from "@config/classPresets"
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
    it("shows Max's ranks only once Max is on, and saves them", async () => {
        renderWithChakra(<StatPriorityList classPreset={preset} />)

        expect(
            screen.queryByLabelText("Max Attack before skills ranked after"),
        ).toBeNull()

        await userEvent.click(
            screen.getByRole("checkbox", { name: "Max Attack" }),
        )

        expect(settings().max.attack.enabled).toBe(true)

        await userEvent.type(
            screen.getByLabelText("Max Attack before passives ranked after"),
            "3",
        )

        expect(settings().max.attack.passiveAfter).toBe(3)
    })

    it("has no ability ranks for Max on This board", async () => {
        renderWithChakra(
            <StatPriorityList classPreset={preset} layout="nezekan" />,
        )

        await userEvent.click(
            screen.getByRole("checkbox", { name: "Max Attack" }),
        )

        expect(settings().max.attack.enabled).toBe(true)
        expect(
            screen.queryByLabelText("Max Attack before skills ranked after"),
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
