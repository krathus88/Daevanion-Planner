import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { CUBE_KEYS_LOCK } from "@account/game/companionLocks"
import { renderWithChakra } from "@test/renderWithChakra"
import { STARTER_TASKS } from "@tracker/config/starterTasks"
import {
    ArenaUnknownContext,
    CompanionLocksContext,
} from "@tracker/context/companionLocks"
import { TaskItem } from "./TaskItem"

const NIGHTMARE = STARTER_TASKS.find((task) => task.id === "nightmare")!

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
})
