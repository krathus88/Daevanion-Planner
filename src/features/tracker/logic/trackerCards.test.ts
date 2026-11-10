import { describe, expect, it } from "vitest"
import type { TrackerCharacter, TrackerTask } from "@tracker/types"
import {
    countTasks,
    getCardOwners,
    getCardProgress,
    getDoneTaskIds,
    getGroupProgress,
    getPendingTasks,
    getPipCount,
    getPipSteps,
    getServerGroups,
    getTaskControl,
    getTaskGroups,
    splitDone,
    splitIgnored,
} from "./trackerCards"

const character = (id: string, server: string): TrackerCharacter => {
    return { id: id, name: id, classId: "cleric", server: server }
}

const task = (overrides: Partial<TrackerTask>): TrackerTask => {
    return {
        id: "t",
        name: "Task",
        reset: "daily",
        cap: 1,
        shared: false,
        ...overrides,
    }
}

describe("getServerGroups", () => {
    it("groups characters by server, in the order they first appear", () => {
        const groups = getServerGroups([
            character("a", "zikel"),
            character("b", "siel"),
            character("c", "zikel"),
        ])

        expect(groups.map((group) => group.name)).toEqual(["Zikel", "Siel"])
        expect(groups[0].characters.map((item) => item.id)).toEqual(["a", "c"])
    })
})

describe("getTaskGroups", () => {
    const tasks = [
        task({ id: "own", reset: "weekly" }),
        task({ id: "shared", reset: "daily", shared: true }),
    ]

    it("takes the shared tasks for server cards", () => {
        const groups = getTaskGroups(tasks, true)

        expect(groups.map((group) => group.reset)).toEqual(["daily"])
        expect(groups[0].tasks.map((item) => item.id)).toEqual(["shared"])
    })

    it("takes the rest for character cards", () => {
        const groups = getTaskGroups(tasks, false)

        expect(groups.map((group) => group.label)).toEqual(["Weekly"])
    })
})

describe("getTaskControl", () => {
    it("picks a control by cap", () => {
        expect(getTaskControl(task({ cap: 1 }))).toBe("pips")
        expect(getTaskControl(task({ cap: 6 }))).toBe("pips")
        expect(getTaskControl(task({ cap: 7 }))).toBe("stepper")
        expect(getTaskControl(task({ cap: 14, recharge: 2 }))).toBe("entries")
    })
})

describe("pips", () => {
    it("has a step for each count up to the cap", () => {
        expect(getPipSteps(3)).toEqual([1, 2, 3])
    })

    it("sets the count, or clears it from the highest filled pip", () => {
        expect(getPipCount(1, 3)).toBe(3)
        expect(getPipCount(3, 1)).toBe(1)
        expect(getPipCount(5, 5)).toBe(0)
        expect(getPipCount(4, 4)).toBe(0)
    })
})

describe("getCardOwners", () => {
    const characters = [
        character("a", "siel"),
        character("b", "siel"),
        character("c", "zikel"),
    ]

    it("lists each server's card, then each character's", () => {
        expect(getCardOwners(characters, true, true)).toEqual([
            "server:siel",
            "server:zikel",
            "a",
            "b",
            "c",
        ])
    })

    it("leaves out the kind of card that has no tasks", () => {
        expect(getCardOwners(characters, false, true)).toEqual(["a", "b", "c"])
        expect(getCardOwners(characters, true, false)).toEqual([
            "server:siel",
            "server:zikel",
        ])
    })
})

describe("getPendingTasks", () => {
    it("lists tasks below their cap and entry tasks with daily entries left", () => {
        const groups = getTaskGroups(
            [
                task({ id: "done", cap: 2 }),
                task({ id: "half", cap: 30 }),
                task({ id: "entries", cap: 14, recharge: 2 }),
                task({ id: "empty", cap: 14, recharge: 2 }),
            ],
            false,
        )
        const pending = getPendingTasks(
            groups,
            {
                done: { period: 5, count: 2 },
                half: { period: 5, count: 12 },
            },
            {
                entries: { period: 5, base: 3, bonus: 2 },
                // Bonus tickets left don't keep it pending.
                empty: { period: 5, base: 0, bonus: 6 },
            },
            [],
            { energy: 1, daily: 5, weekly: 1, siege: 1 },
        )

        expect(pending.map((item) => [item.task.id, item.detail])).toEqual([
            ["half", "12/30"],
            ["entries", "3 left"],
        ])
    })
})

describe("splitIgnored", () => {
    it("moves ignored tasks apart, by reset, dropping empty groups", () => {
        const groups = getTaskGroups(
            [
                task({ id: "d1" }),
                task({ id: "d2" }),
                task({ id: "w1", reset: "weekly" }),
            ],
            false,
        )
        const split = splitIgnored(groups, ["d2", "w1"])

        expect(
            split.active.map((group) => group.tasks.map((item) => item.id)),
        ).toEqual([["d1"]])
        expect(split.ignored.map((group) => group.reset)).toEqual([
            "daily",
            "weekly",
        ])
        expect(countTasks(split.ignored)).toBe(2)
    })
})

describe("done tasks", () => {
    const groups = getTaskGroups(
        [
            task({ id: "a", cap: 2 }),
            task({ id: "b", cap: 2 }),
            task({ id: "c", cap: 1 }),
            task({ id: "w", reset: "weekly" }),
        ],
        false,
    )
    const periods = { energy: 1, daily: 5, weekly: 1, siege: 1 }

    it("lists the tasks done in their period, ignored ones left out", () => {
        const counts = {
            a: { period: 5, count: 2 },
            b: { period: 5, count: 1 },
            c: { period: 5, count: 1 },
            // Done last week only.
            w: { period: 0, count: 1 },
        }

        expect(
            getDoneTaskIds(groups, counts, undefined, ["c"], periods),
        ).toEqual(["a"])
    })

    it("moves stashed tasks apart, by reset, dropping empty groups", () => {
        const split = splitDone(groups, ["a", "w"])

        expect(
            split.todo.map((group) => group.tasks.map((item) => item.id)),
        ).toEqual([["b", "c"]])
        expect(
            split.done.map((group) => group.tasks.map((item) => item.id)),
        ).toEqual([["a"], ["w"]])
    })
})

describe("ignored tasks", () => {
    const groups = getTaskGroups(
        [task({ id: "a", cap: 2 }), task({ id: "b", cap: 2 })],
        false,
    )

    it("are left out of the progress and the minimized summary", () => {
        const counts = {
            a: { period: 5, count: 0 },
            b: { period: 5, count: 2 },
        }
        const periods = { energy: 1, daily: 5, weekly: 1, siege: 1 }

        expect(getCardProgress(groups, counts, {}, ["a"], periods)).toEqual({
            done: 1,
            total: 1,
        })
        expect(getPendingTasks(groups, counts, {}, ["a"], periods)).toEqual([])
    })
})

describe("getCardProgress", () => {
    it("counts tasks at their cap this period, and entry tasks at 0 left", () => {
        const groups = getTaskGroups(
            [
                task({ id: "a", cap: 2 }),
                task({ id: "b", cap: 2 }),
                task({ id: "w", reset: "weekly", cap: 1 }),
                task({ id: "e", cap: 14, recharge: 2 }),
                task({ id: "full", cap: 14, recharge: 2 }),
            ],
            false,
        )
        const progress = getCardProgress(
            groups,
            {
                a: { period: 5, count: 2 },
                b: { period: 5, count: 1 },
                // Done, but last week.
                w: { period: 1, count: 1 },
            },
            { e: { period: 5, base: 0, bonus: 30 } },
            [],
            { energy: 1, daily: 5, weekly: 2, siege: 1 },
        )

        expect(progress).toEqual({ done: 2, total: 5 })
    })
})

describe("getGroupProgress", () => {
    it("counts one reset's done tasks, leaving out ignored ones", () => {
        const [group] = getTaskGroups(
            [
                task({ id: "a", cap: 2 }),
                task({ id: "b", cap: 2 }),
                task({ id: "c", cap: 2 }),
            ],
            false,
        )
        const counts = {
            a: { period: 5, count: 2 },
            c: { period: 5, count: 2 },
        }

        expect(getGroupProgress(group, counts, {}, ["c"], 5)).toEqual({
            done: 1,
            total: 2,
        })
    })
})
