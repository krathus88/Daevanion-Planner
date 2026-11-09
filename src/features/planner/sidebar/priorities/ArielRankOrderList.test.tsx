import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { readArielSettings } from "@planner/storage/arielSettings"
import { readRankOrder } from "@planner/storage/rankOrder"
import { renderWithChakra } from "@test/renderWithChakra"
import { ArielRankOrderList } from "./ArielRankOrderList"
import { RankOrderList } from "./RankOrderList"

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

describe("ArielRankOrderList", () => {
    it("lists offensive and defensive special nodes and stats", () => {
        renderWithChakra(<ArielRankOrderList classId={CLASS} />)

        for (const name of [
            "Offensive special nodes",
            "Defensive special nodes",
            "Offensive stats",
            "Defensive stats",
        ]) {
            expect(
                screen.getByRole("radiogroup", {
                    name: `${name} order within a rank`,
                }),
            ).toBeInTheDocument()
        }
    })

    it("saves a group's level", async () => {
        renderWithChakra(<ArielRankOrderList classId={CLASS} />)

        const group = screen.getByRole("radiogroup", {
            name: "Defensive stats order within a rank",
        })

        expect(within(group).queryByText("Ignore")).toBeNull()

        await userEvent.click(within(group).getByText("Less"))

        expect(readArielSettings(CLASS).order["stat-defense"]).toBe("less")
        expect(readArielSettings(CLASS).order["stat-offense"]).toBe("equal")
    })

    it("ignores a group by its name and brings it back at its level", async () => {
        renderWithChakra(<ArielRankOrderList classId={CLASS} />)

        const name = screen.getByRole("button", {
            name: "Ignore Defensive stats",
        })
        const group = screen.getByRole("radiogroup", {
            name: "Defensive stats order within a rank",
        })

        await userEvent.click(name)

        expect(readArielSettings(CLASS).ignoredGroups).toEqual(["stat-defense"])
        expect(name).toHaveAttribute("aria-pressed", "true")
        expect(group).toHaveAttribute("data-disabled")
        expect(group.querySelector("[data-state='checked']")).toBeNull()

        await userEvent.click(name)

        expect(readArielSettings(CLASS).ignoredGroups).toEqual([])
        expect(readArielSettings(CLASS).order["stat-defense"]).toBe("equal")
        expect(group.querySelector("[data-state='checked']")).not.toBeNull()
    })
})

describe("RankOrderList", () => {
    it("offers no Ignore on the main boards", async () => {
        renderWithChakra(<RankOrderList classId={CLASS} />)

        const group = screen.getByRole("radiogroup", {
            name: "Passives order within a rank",
        })

        expect(within(group).queryByText("Ignore")).toBeNull()

        await userEvent.click(within(group).getByText("More"))

        expect(readRankOrder(CLASS).passive).toBe("more")
    })
})
