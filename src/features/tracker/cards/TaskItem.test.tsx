import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { CUBE_KEYS_LOCK } from "@account/game/companionLocks"
import { renderWithChakra } from "@test/renderWithChakra"
import { STARTER_TASKS } from "@tracker/config/starterTasks"
import {
    ArenaUnknownContext,
    CompanionLocksContext,
    CorridorsUnknownContext,
} from "@tracker/context/companionLocks"
import { TaskItem } from "./TaskItem"

const NIGHTMARE = STARTER_TASKS.find((task) => task.id === "nightmare")!
const CORRIDOR = {
    ...STARTER_TASKS.find((task) => task.id === "corridors")!,
    id: "corridors:1001",
    name: "Reshanta's Root",
    subtitle: "Abyss corridor",
}

const renderCorridor = (unknown: boolean) => {
    renderWithChakra(
        <CompanionLocksContext value={{ a: new Set(["corridors"]) }}>
            <CorridorsUnknownContext value={unknown}>
                <TaskItem
                    task={CORRIDOR}
                    owner="a"
                    ownerLabel="Testchar"
                    period={0}
                    ignored={false}
                    onCountChange={vi.fn()}
                    onEntriesChange={vi.fn()}
                    onIgnoredChange={vi.fn()}
                />
            </CorridorsUnknownContext>
        </CompanionLocksContext>,
    )
}

const renderItem = (locks: Record<string, ReadonlySet<string>>) => {
    renderWithChakra(
        <CompanionLocksContext value={locks}>
            <TaskItem
                task={NIGHTMARE}
                owner="a"
                ownerLabel="Testchar"
                period={0}
                ignored={false}
                onCountChange={vi.fn()}
                onEntriesChange={vi.fn()}
                onIgnoredChange={vi.fn()}
            />
        </CompanionLocksContext>,
    )
}

describe("TaskItem", () => {
    // jsdom lacks what Chakra's Popover uses to place itself.
    beforeAll(() => {
        vi.stubGlobal(
            "ResizeObserver",
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        )
    })

    it("shows a task the companion app fills as just its counter", () => {
        renderItem({ a: new Set(["nightmare"]) })

        expect(
            screen.getByLabelText(
                /^Nightmare.*Testchar: 14 of 14 entries left, \d+ bonus$/,
            ),
        ).toHaveTextContent(/^14\/14 \+\d+$/)
        expect(screen.queryByRole("button", { name: /^Use one/ })).toBeNull()

        expect(
            screen.getByRole("img", { name: "Filled by the companion app" }),
        ).toBeInTheDocument()
        expect(document.querySelector("[inert]")).not.toBeNull()
    })

    it("leaves other tasks and owners usable", () => {
        renderItem({ a: new Set([CUBE_KEYS_LOCK]), b: new Set(["nightmare"]) })

        expect(
            screen.getByRole("button", { name: /^Use one: Nightmare/ }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole("img", { name: "Filled by the companion app" }),
        ).toBeNull()
        expect(document.querySelector("[inert]")).toBeNull()
    })

    it("warns on an arena task whose week is unknown, and confirms its counts", async () => {
        const onConfirm = vi.fn()
        const arena = STARTER_TASKS.find((task) => task.id === "arena-wins")!

        renderWithChakra(
            <ArenaUnknownContext
                value={{ owners: new Set(["a"]), onConfirm: onConfirm }}
            >
                <TaskItem
                    task={arena}
                    owner="a"
                    ownerLabel="Testchar"
                    period={5}
                    ignored={false}
                    onCountChange={vi.fn()}
                    onEntriesChange={vi.fn()}
                    onIgnoredChange={vi.fn()}
                />
            </ArenaUnknownContext>,
        )

        await userEvent.click(
            screen.getByRole("button", { name: /isn't filled from the game$/ }),
        )
        // The panel stays invisible until placed, which jsdom can't do: find
        // its button by text.
        await userEvent.click(await screen.findByText("Counts are right"))

        expect(onConfirm).toHaveBeenCalledWith("a", 5)
    })

    it("doesn't warn on other tasks", () => {
        renderWithChakra(
            <ArenaUnknownContext
                value={{ owners: new Set(["a"]), onConfirm: vi.fn() }}
            >
                <TaskItem
                    task={NIGHTMARE}
                    owner="a"
                    ownerLabel="Testchar"
                    period={0}
                    ignored={false}
                    onCountChange={vi.fn()}
                    onEntriesChange={vi.fn()}
                    onIgnoredChange={vi.fn()}
                />
            </ArenaUnknownContext>,
        )

        expect(
            screen.queryByRole("button", {
                name: /isn't filled from the game$/,
            }),
        ).toBeNull()
    })

    // Login sends no corridor entrances: unknown until the Abyss.
    it("warns on a corridor row whose entrances are unknown, and keeps it manual", async () => {
        renderCorridor(true)

        await userEvent.click(
            screen.getByRole("button", {
                name: /Reshanta's Root \(Abyss corridor\), Testchar: no data/,
            }),
        )

        expect(
            await screen.findByText(/Go to the Abyss on Testchar/),
        ).toBeInTheDocument()
        // Its pip stays usable.
        expect(
            screen.getByRole("group", { name: /^Reshanta's Root/ }),
        ).toBeInTheDocument()
    })

    it("locks a corridor row with the Corridors task once known", () => {
        renderCorridor(false)

        expect(screen.queryByRole("button", { name: /no data/ })).toBeNull()
        expect(
            screen.getByLabelText(/^Reshanta's Root.*Testchar: /),
        ).toHaveTextContent("0/1")
        expect(screen.queryByRole("group")).toBeNull()
    })
})
