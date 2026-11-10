import {
    screen,
    waitFor,
    waitForElementToBeRemoved,
    within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { STARTER_TASKS, STARTS_IGNORED } from "./config/starterTasks"
import { STARTER_IDS } from "./logic/presetTasks"
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

// What every character starts with ignored.
const START_IGNORED = {
    a: [...STARTS_IGNORED],
    b: [...STARTS_IGNORED],
    c: [...STARTS_IGNORED],
}

// Aria and Bran share Siel; Cael is on Zikel.
const withCharacters = () => {
    writeTrackerData({
        characters: [
            { id: "a", name: "Aria", classId: "cleric", server: "siel" },
            { id: "b", name: "Bran", classId: "templar", server: "siel" },
            { id: "c", name: "Cael", classId: "ranger", server: "zikel" },
        ],
        tasks: null,
        presets: STARTER_IDS,
        counts: {},
        entries: {},
        minimized: [],
        ignored: START_IGNORED,
        energy: {},
        notes: {},
        membership: true,
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

        // Arena 1v1 starts in the collapsed Ignored section.
        for (const task of STARTER_TASKS) {
            const owner = task.shared ? "Siel" : "Aria"
            const card = screen.getByRole("article", { name: owner })
            const button = within(card).queryByRole("button", {
                name: `Ignore: ${getTaskTitle(task)}, ${owner}`,
            })

            if (STARTS_IGNORED.includes(task.id)) {
                expect(button).not.toBeInTheDocument()
            } else {
                expect(button).toBeInTheDocument()
            }
        }
        expect(
            within(screen.getByRole("article", { name: "Aria" })).getByRole(
                "button",
                { name: /^Ignored · 2/ },
            ),
        ).toBeInTheDocument()

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
            within(aria).getByRole("img", { name: "Arena 5v5 (Wins) 0/30" }),
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

    it("links a character's name to its kisk.app page without minimizing", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const aria = screen.getByRole("article", { name: "Aria" })
        const link = within(aria).getByRole("link", { name: "Aria" })

        expect(link).toHaveAttribute(
            "href",
            "https://kisk.app/c/eu/siel/Aria/gear",
        )
        expect(link).toHaveAttribute("target", "_blank")
        // Server cards have no page there.
        expect(
            within(screen.getByRole("article", { name: "Siel" })).queryByRole(
                "link",
            ),
        ).not.toBeInTheDocument()

        // jsdom doesn't navigate; the click only must not reach the header.
        link.addEventListener("click", (event) => {
            event.preventDefault()
        })
        await userEvent.click(link)

        expect(readTrackerData().minimized).toEqual([])
    })

    it("shows each card's progress", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const aria = screen.getByRole("article", { name: "Aria" })

        expect(within(aria).getByText("0/11")).toBeInTheDocument()

        await userEvent.click(
            within(aria).getByRole("button", {
                name: "Supply Requests, Aria: 1 of 1",
            }),
        )

        expect(within(aria).getByText("1/11")).toBeInTheDocument()
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

        // Both Daily boxes count all the dailies, and the one in Done isn't
        // complete while Nightmare is left.
        const dailies = await within(aria).findAllByRole("group", {
            name: "Daily",
        })

        expect(dailies).toHaveLength(2)

        for (const box of dailies) {
            expect(box).toHaveTextContent("1/2")
        }

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
                name: "Ignore: Arena 5v5 (Wins), Aria",
            }),
        )

        // It fades out first, then moves.
        expect(readTrackerData().ignored).toEqual(START_IGNORED)
        await waitFor(() => {
            expect(readTrackerData().ignored).toEqual({
                ...START_IGNORED,
                a: [...STARTS_IGNORED, "arena-wins"],
            })
        })
        expect(within(aria).getByText("0/10")).toBeInTheDocument()
        // Other characters still count it.
        expect(
            within(screen.getByRole("article", { name: "Bran" })).getByText(
                "0/11",
            ),
        ).toBeInTheDocument()

        // It moves into the card's collapsed Ignored section.
        expect(
            within(aria).queryByRole("button", {
                name: "Stop ignoring: Arena 5v5 (Wins), Aria",
            }),
        ).not.toBeInTheDocument()

        await userEvent.click(
            within(aria).getByRole("button", { name: /^Ignored · 3/ }),
        )
        // In a Weekly box of its own, like the Done section.
        expect(
            await within(aria).findAllByRole("group", { name: "Weekly" }),
        ).toHaveLength(2)
        await userEvent.click(
            await within(aria).findByRole("button", {
                name: "Stop ignoring: Arena 5v5 (Wins), Aria",
            }),
        )

        expect(readTrackerData().ignored).toEqual(START_IGNORED)
        expect(
            within(aria).getByRole("button", {
                name: "Ignore: Arena 5v5 (Wins), Aria",
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

        expect(within(siel).getByText("0/8")).toBeInTheDocument()

        await userEvent.click(
            screen.getByRole("button", { name: `All done: ${label}` }),
        )

        expect(screen.getByLabelText(`Entries left: ${label}`)).toHaveValue("0")
        expect(within(siel).getByText("1/8")).toBeInTheDocument()
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

        expect(daily).toHaveTextContent("0/3")
        expect(weekly).toHaveTextContent("0/5")

        await userEvent.click(
            screen.getByRole("button", { name: "Duty Missions, Siel: 5 of 5" }),
        )

        expect(daily).toHaveTextContent("1/3")
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

        const label = "Arena 5v5 (Wins), Aria"
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

    it("tracks Invasion per server as entries, without a bonus line", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const label = "Invasion, Siel"
        const siel = screen.getByRole("article", { name: "Siel" })

        expect(
            within(
                within(siel).getByRole("group", { name: "Daily" }),
            ).getByLabelText(`Entries left: ${label}`),
        ).toHaveValue("7")
        expect(
            screen.queryByLabelText(`Bonus tickets: ${label}`),
        ).not.toBeInTheDocument()

        await userEvent.click(
            screen.getByRole("button", { name: `Use one: ${label}` }),
        )

        expect(readTrackerData().entries["server:siel"].invasion).toMatchObject(
            { base: 6, bonus: 0 },
        )
        // Shared: Zikel keeps its own entries.
        expect(
            screen.getByLabelText("Entries left: Invasion, Zikel"),
        ).toHaveValue("7")
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

    it("shows Odyle Energy on character cards only, outside the progress", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const label = "Odyle Energy, Aria"
        const aria = screen.getByRole("article", { name: "Aria" })
        const total = within(aria).getByRole("button", {
            name: `${label}: 840, edit`,
        })

        // Not a task: no box or tile of its own, above the Daily box.
        expect(within(aria).getAllByRole("group")[0]).toHaveAccessibleName(
            "Daily",
        )
        expect(total.closest('[role="group"]')).toBeNull()
        expect(
            within(screen.getByRole("article", { name: "Siel" })).queryByRole(
                "button",
                { name: /^Odyle Energy, Siel/ },
            ),
        ).not.toBeInTheDocument()
        // Only the total until the fields are opened.
        expect(screen.queryByLabelText(`Energy: ${label}`)).toBeNull()

        await userEvent.click(
            screen.getByRole("button", { name: `Spend 80: ${label}` }),
        )

        expect(
            screen.getByRole("button", { name: `${label}: 760, edit` }),
        ).toBeInTheDocument()
        expect(within(aria).getByText("0/11")).toBeInTheDocument()

        await userEvent.click(
            screen.getByRole("button", { name: `${label}: 760, edit` }),
        )

        const energy = screen.getByLabelText(`Energy: ${label}`)

        expect(energy).toHaveFocus()
        expect(energy).toHaveValue("760")

        // 25 left and 70 extra: the recharged part goes first. Pasted, as
        // focus selects the value again a frame later, between typed keys.
        await userEvent.clear(energy)
        await userEvent.paste("25")
        await userEvent.click(screen.getByLabelText(`Extra energy: ${label}`))
        await userEvent.paste("70")
        await userEvent.click(
            screen.getByRole("button", { name: `Spend 80: ${label}` }),
        )

        expect(readTrackerData().energy.a).toMatchObject({
            base: 0,
            bonus: 15,
        })
        // Too little left for a cube.
        expect(
            screen.getByRole("button", { name: `Spend 80: ${label}` }),
        ).toBeDisabled()
        expect(within(aria).getByText("0/11")).toBeInTheDocument()
    })

    it("keeps Odyle Energy on a minimized card", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        await userEvent.click(
            screen.getByRole("button", { name: "Minimize Aria" }),
        )

        const aria = screen.getByRole("article", { name: "Aria" })

        expect(
            within(aria).getByRole("button", {
                name: "Odyle Energy, Aria: 840, edit",
            }),
        ).toBeInTheDocument()
        expect(
            within(aria).getByRole("button", {
                name: "Spend 80: Odyle Energy, Aria",
            }),
        ).toBeInTheDocument()
    })

    it("closes the Odyle Energy fields once focus leaves the row", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        await userEvent.click(
            screen.getByRole("button", {
                name: "Odyle Energy, Aria: 840, edit",
            }),
        )

        expect(
            screen.getByLabelText("Energy: Odyle Energy, Aria"),
        ).toHaveFocus()

        // Between its own fields it stays open.
        await userEvent.tab()

        expect(
            screen.getByLabelText("Extra energy: Odyle Energy, Aria"),
        ).toHaveFocus()

        await userEvent.click(
            screen.getByRole("button", { name: "Characters" }),
        )

        expect(
            screen.queryByLabelText("Energy: Odyle Energy, Aria"),
        ).not.toBeInTheDocument()
    })

    it("caps Odyle Energy at 560 and cubes at 40 without the membership", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        expect(
            screen.getByLabelText("Odyle Energy, Aria: 840, edit"),
        ).toBeInTheDocument()

        await userEvent.click(
            screen.getByRole("button", { name: "Characters" }),
        )

        const dialog = await screen.findByRole("dialog", { name: "Characters" })
        const membership = within(dialog).getByRole("checkbox", {
            name: "Special Quai Membership",
        })

        expect(membership).toBeChecked()

        await userEvent.click(membership)

        expect(readTrackerData().membership).toBe(false)
        expect(
            screen.getByLabelText("Odyle Energy, Aria: 560, edit"),
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText("Odyle Energy, Bran: 560, edit"),
        ).toBeInTheDocument()

        await userEvent.keyboard("{Escape}")
        await waitForElementToBeRemoved(dialog)
        await userEvent.click(
            screen.getByRole("button", {
                name: "Spend 40: Odyle Energy, Aria",
            }),
        )

        expect(readTrackerData().energy.a).toMatchObject({ base: 520 })
    })

    it("edits a character's note, its short line between Odyle Energy and the boxes", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        const aria = screen.getByRole("article", { name: "Aria" })

        await userEvent.click(
            within(aria).getByRole("button", { name: "Note for Aria" }),
        )

        const dialog = await screen.findByRole("dialog", {
            name: "Note for Aria",
        })

        await userEvent.type(
            within(dialog).getByRole("textbox", { name: "Short" }),
            "Alt for keys",
        )
        await userEvent.type(
            within(dialog).getByRole("textbox", { name: "Details" }),
            "Runs Shugo only",
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Save" }),
        )
        await waitFor(() => {
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        })

        expect(readTrackerData().notes).toEqual({
            a: { short: "Alt for keys", long: "Runs Shugo only" },
        })
        // Clicking in the dialog didn't reach the header.
        expect(readTrackerData().minimized).toEqual([])

        const short = within(aria).getByText("Alt for keys")
        const energy = within(aria).getByRole("button", {
            name: "Odyle Energy, Aria: 840, edit",
        })
        const daily = within(aria).getByRole("group", { name: "Daily" })

        expect(
            energy.compareDocumentPosition(short) &
                Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
        expect(
            short.compareDocumentPosition(daily) &
                Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
        // Only Aria has one.
        expect(
            within(screen.getByRole("article", { name: "Bran" })).queryByText(
                "Alt for keys",
            ),
        ).not.toBeInTheDocument()
    })

    it("cancels a note edit, and shows the note on a minimized card", async () => {
        withCharacters()
        renderWithChakra(<TrackerPage />)

        await userEvent.click(
            screen.getByRole("button", { name: "Note for Aria" }),
        )

        const dialog = await screen.findByRole("dialog", {
            name: "Note for Aria",
        })

        await userEvent.type(
            within(dialog).getByRole("textbox", { name: "Short" }),
            "Unsaved",
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Cancel" }),
        )
        await waitFor(() => {
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        })

        expect(readTrackerData().notes).toEqual({})
        expect(screen.queryByText("Unsaved")).not.toBeInTheDocument()

        writeTrackerData({
            ...readTrackerData(),
            notes: { a: { short: "Main", long: "" } },
        })
        await userEvent.click(
            screen.getByRole("button", { name: "Minimize Aria" }),
        )

        expect(
            within(screen.getByRole("article", { name: "Aria" })).getByText(
                "Main",
            ),
        ).toBeInTheDocument()
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
