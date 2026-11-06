import {
    screen,
    waitFor,
    waitForElementToBeRemoved,
    within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { STARTER_TASKS } from "./config/starterTasks"
import { getTaskTitle } from "./logic/taskTitle"
import { readTrackerData, writeTrackerData } from "./storage/trackerData"
import { TrackerPage } from "./TrackerPage"

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

// Aria and Bran share Siel; Cael is on Zikel.
const withCharacters = () => {
    writeTrackerData({
        characters: [
            { id: "a", name: "Aria", classId: "cleric", server: "siel" },
            { id: "b", name: "Bran", classId: "templar", server: "siel" },
            { id: "c", name: "Cael", classId: "ranger", server: "zikel" },
        ],
        tasks: null,
        counts: {},
        entries: {},
        minimized: [],
        ignored: {},
    })
}

afterEach(() => {
    localStorage.clear()
})

describe("TrackerPage", () => {
    it("asks for a character first", async () => {
        renderWithChakra(<TrackerPage />)

        await userEvent.click(
            screen.getByRole("button", { name: "Add a character" }),
        )

        const dialog = await screen.findByRole("dialog", { name: "Characters" })

        await userEvent.type(
            within(dialog).getByLabelText("New character name"),
            "Aria",
        )
        await userEvent.selectOptions(
            within(dialog).getByLabelText("New character class"),
            "Ranger",
        )
        await userEvent.selectOptions(
            within(dialog).getByLabelText("New character server"),
            "Zikel",
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Add" }),
        )

        expect(readTrackerData().characters).toMatchObject([
            { name: "Aria", classId: "ranger", server: "zikel" },
        ])
        // The open dialog hides the page from the accessibility tree.
        const card = screen.getByRole("article", { name: "Aria", hidden: true })

        expect(card).toHaveTextContent("Ranger · Zikel")
    })

    it("shows each server's shared tasks first, then a card per character", () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        expect(
            screen
                .getAllByRole("article")
                .map((card) => card.getAttribute("aria-label")),
        ).toEqual(["Siel", "Zikel", "Aria", "Bran", "Cael"])

        for (const task of STARTER_TASKS) {
            const owner = task.shared ? "Siel" : "Aria"
            const card = screen.getByRole("article", { name: owner })

            expect(
                within(card).getByRole("button", {
                    name: `Ignore: ${getTaskTitle(task)}, ${owner}`,
                }),
            ).toBeInTheDocument()
        }

        // The subtitle sits on its own line under the name.
        expect(
            within(screen.getByRole("article", { name: "Aria" })).getAllByText(
                "Shop",
            ),
        ).toHaveLength(1)
    })

    it("minimizes a card to what's left, and all of them at once", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        await userEvent.click(
            screen.getByRole("button", {
                name: "Battlefield (Wins), Aria: 3 of 3",
            }),
        )
        await userEvent.click(
            screen.getByRole("button", { name: "Minimize Aria" }),
        )

        const aria = screen.getByRole("article", { name: "Aria" })

        expect(
            within(aria).queryByRole("button", {
                name: "Battlefield (Wins), Aria: 1 of 3",
            }),
        ).not.toBeInTheDocument()
        expect(
            within(aria).getByRole("img", { name: "Arena (Wins) 0/30" }),
        ).toBeInTheDocument()
        expect(
            within(aria).queryByRole("img", { name: /Battlefield \(Wins\)/ }),
        ).not.toBeInTheDocument()
        expect(readTrackerData().minimized).toEqual(["a"])

        await userEvent.click(
            screen.getByRole("button", { name: "Minimize all" }),
        )

        expect(readTrackerData().minimized).toHaveLength(5)

        await userEvent.click(
            screen.getByRole("button", { name: "Expand all" }),
        )

        expect(readTrackerData().minimized).toEqual([])
        expect(
            screen.getByRole("button", { name: "Minimize Siel" }),
        ).toHaveAttribute("aria-expanded", "true")
    })

    it("shows each card's progress", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const aria = screen.getByRole("article", { name: "Aria" })

        expect(within(aria).getByText("0/10 done")).toBeInTheDocument()

        await userEvent.click(
            within(aria).getByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        )

        expect(within(aria).getByText("1/10 done")).toBeInTheDocument()
    })

    it("ticks a task with a cap of 1", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        await userEvent.click(
            screen.getByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        )

        expect(
            screen.getByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        ).toHaveAttribute("aria-pressed", "true")
        expect(
            screen.getByRole("button", {
                name: "Supply Requests, Bran: 1 of 1",
            }),
        ).toHaveAttribute("aria-pressed", "false")
        expect(readTrackerData().counts.a["supply-requests"].count).toBe(1)
    })

    it("moves done tasks into a Done section once the card is left", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const aria = screen.getByRole("article", { name: "Aria" })
        const bran = screen.getByRole("article", { name: "Bran" })

        await userEvent.click(
            within(aria).getByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        )

        // It stays put while the pointer is still on the card.
        expect(
            within(aria).getByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        ).toBeVisible()
        expect(
            within(aria).queryByRole("button", { name: /^Done/ }),
        ).not.toBeInTheDocument()

        await userEvent.unhover(aria)

        // It fades out first, then moves.
        await waitForElementToBeRemoved(
            within(aria).queryByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        )

        // A click outside the card works too, for touch screens.
        await userEvent.click(
            within(bran).getByRole("button", {
                name: "Supply Requests, Bran: 1 of 1",
            }),
        )
        await userEvent.click(document.body)

        await waitForElementToBeRemoved(
            within(bran).queryByRole("button", {
                name: "Supply Requests, Bran: 1 of 1",
            }),
        )

        // Undone from the Done section, it comes back at once.
        await userEvent.click(
            within(aria).getByRole("button", { name: /^Done · 1/ }),
        )
        await userEvent.click(
            await within(aria).findByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        )

        expect(
            within(aria).queryByRole("button", { name: /^Done/ }),
        ).not.toBeInTheDocument()
        expect(
            within(aria).getByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        ).toHaveAttribute("aria-pressed", "false")

        // Done again, it waits for the next leave like the first time.
        await userEvent.click(
            within(aria).getByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        )

        expect(
            within(aria).getByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        ).toHaveAttribute("aria-pressed", "true")

        await userEvent.unhover(aria)
        await waitForElementToBeRemoved(
            within(aria).queryByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        )
    })

    it("sets a small count with one click on its pip", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const label = "Battlefield (Wins), Aria"

        await userEvent.click(
            screen.getByRole("button", { name: `${label}: 3 of 3` }),
        )

        expect(readTrackerData().counts.a["battlefield-wins"].count).toBe(3)
        expect(
            screen.getByRole("button", { name: `${label}: 2 of 3` }),
        ).toHaveAttribute("aria-pressed", "true")

        // Clicking the highest filled pip again clears the count.
        await userEvent.click(
            screen.getByRole("button", { name: `${label}: 3 of 3` }),
        )

        expect(readTrackerData().counts.a["battlefield-wins"].count).toBe(0)
    })

    it("ignores a task for good, out of the progress", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const aria = screen.getByRole("article", { name: "Aria" })

        await userEvent.click(
            within(aria).getByRole("button", {
                name: "Ignore: Arena (Wins), Aria",
            }),
        )

        // It fades out first, then moves.
        expect(readTrackerData().ignored).toEqual({})
        await waitFor(() => {
            expect(readTrackerData().ignored).toEqual({ a: ["arena-wins"] })
        })
        expect(within(aria).getByText("0/9 done")).toBeInTheDocument()
        // Other characters still count it.
        expect(
            within(screen.getByRole("article", { name: "Bran" })).getByText(
                "0/10 done",
            ),
        ).toBeInTheDocument()

        // It moves into the card's collapsed Ignored section.
        expect(
            within(aria).queryByRole("button", {
                name: "Stop ignoring: Arena (Wins), Aria",
            }),
        ).not.toBeInTheDocument()

        await userEvent.click(
            within(aria).getByRole("button", { name: /^Ignored · 1/ }),
        )
        await userEvent.click(
            await within(aria).findByRole("button", {
                name: "Stop ignoring: Arena (Wins), Aria",
            }),
        )

        expect(readTrackerData().ignored).toEqual({})
        expect(
            within(aria).getByRole("button", {
                name: "Ignore: Arena (Wins), Aria",
            }),
        ).toBeInTheDocument()
    })

    it("minimizes a card from anywhere on its header", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        await userEvent.click(
            within(screen.getByRole("article", { name: "Aria" })).getByText(
                "Cleric · Siel",
            ),
        )

        expect(readTrackerData().minimized).toEqual(["a"])
    })

    it("counts the Daily Dungeon done at 0 left, bonus or not", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const label = "Daily Dungeon (Unknown Fissure), Siel"
        const siel = screen.getByRole("article", { name: "Siel" })

        await userEvent.click(
            screen.getByRole("button", { name: `One bonus more: ${label}` }),
        )

        expect(within(siel).getByText("0/7 done")).toBeInTheDocument()

        await userEvent.click(
            screen.getByRole("button", { name: `All done: ${label}` }),
        )

        expect(screen.getByLabelText(`Entries left: ${label}`)).toHaveValue("0")
        expect(within(siel).getByText("1/7 done")).toBeInTheDocument()
        expect(
            screen.getByLabelText(`Bonus tickets: ${label}`),
        ).toHaveTextContent("Bonus 1/30")
    })

    it("counts each reset's box apart", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const siel = screen.getByRole("article", { name: "Siel" })
        const daily = within(siel).getByRole("group", { name: "Daily" })
        const weekly = within(siel).getByRole("group", { name: "Weekly" })

        expect(daily).toHaveTextContent("0/2")
        expect(weekly).toHaveTextContent("0/5")

        await userEvent.click(
            screen.getByRole("button", { name: "Duty Missions, Siel: 5 of 5" }),
        )

        expect(daily).toHaveTextContent("1/2")
        expect(weekly).toHaveTextContent("0/5")

        // The Daily Dungeon refills weekly, so it's in the weekly box.
        await userEvent.click(
            screen.getByRole("button", {
                name: "All done: Daily Dungeon (Unknown Fissure), Siel",
            }),
        )

        expect(weekly).toHaveTextContent("1/5")
    })

    it("counts a large cap up, down, by typing and to the max", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const label = "Arena (Wins), Aria"
        const more = screen.getByRole("button", { name: `One more: ${label}` })

        await userEvent.click(more)
        await userEvent.click(more)
        await userEvent.click(
            screen.getByRole("button", { name: `One less: ${label}` }),
        )

        expect(screen.getByLabelText(label)).toHaveValue("1")

        // Focus selects the count, so typing replaces it. One digit: the input
        // selects again a frame later, which can land between typed keys.
        await userEvent.type(screen.getByLabelText(label), "7")

        expect(screen.getByLabelText(label)).toHaveValue("7")

        await userEvent.click(
            screen.getByRole("button", { name: `All done: ${label}` }),
        )

        expect(screen.getByLabelText(label)).toHaveValue("30")
        expect(more).toBeDisabled()
    })

    it("keeps one count per server for shared tasks", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        await userEvent.click(
            screen.getByRole("button", { name: "Duty Missions, Siel: 2 of 5" }),
        )

        expect(
            readTrackerData().counts["server:siel"]["duty-missions"].count,
        ).toBe(2)
        expect(
            screen.getByRole("button", {
                name: "Duty Missions, Zikel: 1 of 5",
            }),
        ).toHaveAttribute("aria-pressed", "false")
    })

    it("spends Daily Dungeon entries, then bonus tickets", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const label = "Daily Dungeon (Unknown Fissure), Siel"
        const left = screen.getByLabelText(`Entries left: ${label}`)

        expect(left).toHaveValue("14")

        await userEvent.click(
            screen.getByRole("button", { name: `One bonus more: ${label}` }),
        )
        await userEvent.click(
            screen.getByRole("button", { name: `Use one: ${label}` }),
        )

        expect(left).toHaveValue("13")
        expect(
            screen.getByLabelText(`Bonus tickets: ${label}`),
        ).toHaveTextContent("Bonus 1/30")

        await userEvent.clear(left)

        await userEvent.click(
            screen.getByRole("button", { name: `Use one: ${label}` }),
        )

        expect(
            readTrackerData().entries["server:siel"]["unknown-fissure"],
        ).toMatchObject({ base: 0, bonus: 0 })
        expect(
            screen.getByLabelText(
                "Entries left: Daily Dungeon (Unknown Fissure), Zikel",
            ),
        ).toHaveValue("14")
    })

    it("edits the task list", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        await userEvent.click(screen.getByRole("button", { name: "Tasks" }))

        const dialog = await screen.findByRole("dialog", { name: "Tasks" })

        await userEvent.type(
            within(dialog).getByLabelText("New task name"),
            "Gather herbs",
        )
        await userEvent.type(within(dialog).getByLabelText("New task cap"), "3")
        await userEvent.click(
            within(dialog).getByLabelText("New task shared by server"),
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Add" }),
        )

        expect(readTrackerData().tasks?.at(-1)).toMatchObject({
            name: "Gather herbs",
            reset: "daily",
            cap: 3,
            shared: true,
        })

        await userEvent.click(
            within(dialog).getByRole("button", {
                name: "Remove Duty Missions (server)",
            }),
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Remove" }),
        )

        expect(
            readTrackerData().tasks?.some(
                (task) => task.id === "duty-missions",
            ),
        ).toBe(false)

        // A removed preset waits in its own list to be added back.
        const presets = within(dialog).getByRole("region", {
            name: "Removed presets",
        })

        await userEvent.click(
            within(presets).getByRole("button", {
                name: "Add back Duty Missions (server)",
            }),
        )

        expect(
            readTrackerData().tasks?.some(
                (task) => task.id === "duty-missions",
            ),
        ).toBe(true)
        expect(
            within(dialog).queryByRole("region", { name: "Removed presets" }),
        ).not.toBeInTheDocument()

        await userEvent.click(
            within(dialog).getByRole("button", {
                name: "Restore the starter list",
            }),
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Replace my tasks" }),
        )

        expect(readTrackerData().tasks).toBeNull()
    })

    it("changes a character's server and removes one after asking", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        await userEvent.click(
            screen.getByRole("button", { name: "Characters" }),
        )

        const dialog = await screen.findByRole("dialog", { name: "Characters" })

        await userEvent.selectOptions(
            within(dialog).getByLabelText("Server of Bran"),
            "Zikel",
        )

        expect(readTrackerData().characters[1].server).toBe("zikel")

        await userEvent.click(
            within(dialog).getByRole("button", { name: "Remove Aria" }),
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Remove" }),
        )

        expect(readTrackerData().characters.map((c) => c.id)).toEqual([
            "b",
            "c",
        ])
    })
})
