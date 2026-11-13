import { describe, expect, it } from "vitest"
import { STARTER_TASKS, STARTS_IGNORED } from "@tracker/config/starterTasks"
import { MAX_TASK_CAP } from "@tracker/storage/trackerData"
import type { TrackerData, TrackerTask } from "@tracker/types"
import {
    addCharacter,
    confirmArenaWeek,
    declineGameCharacter,
    addTask,
    getTasks,
    getRemovedPresets,
    moveCharacter,
    moveTask,
    removeCharacter,
    removeTask,
    restorePreset,
    restoreStarterTasks,
    setCount,
    setCubeKeys,
    setEntries,
    setEnergy,
    setGoalsOpen,
    setIgnored,
    setMembership,
    setNote,
    setMinimized,
    updateCharacter,
    updateTask,
} from "./trackerEdits"

const TASK: TrackerTask = {
    id: "t",
    name: "Task",
    reset: "weekly",
    cap: 5,
    shared: false,
}

const DUNGEON: TrackerTask = {
    id: "d",
    name: "Daily Dungeon",
    reset: "daily",
    cap: 14,
    shared: true,
    recharge: 2,
    bonusCap: 30,
}

const data = (overrides: Partial<TrackerData> = {}): TrackerData => {
    return {
        characters: [
            { id: "a", name: "Aria", classId: "cleric", server: "siel" },
            { id: "b", name: "Bran", classId: "templar", server: "siel" },
        ],
        tasks: [TASK],
        counts: {},
        entries: {},
        minimized: [],
        goalsOpen: [],
        ignored: {},
        energy: {},
        notes: {},
        cubeKeys: {},
        arena: {},
        corridorHolds: {},
        corridorsLeft: {},
        declined: [],
        membership: true,
        ...overrides,
    }
}

const task = (id: string, reset: TrackerTask["reset"], shared: boolean) => {
    return { id: id, name: id, reset: reset, cap: 1, shared: shared }
}

describe("getTasks", () => {
    it("uses the starter list until the user has their own", () => {
        expect(getTasks(data({ tasks: null }))).toBe(STARTER_TASKS)
        expect(getTasks(data())).toEqual([TASK])
    })
})

describe("setCount", () => {
    it("saves the count with its period", () => {
        const next = setCount(data(), "a", TASK, 7, 3)

        expect(next.counts.a.t).toEqual({ period: 7, count: 3 })
    })

    it("stays between 0 and the cap", () => {
        expect(setCount(data(), "a", TASK, 7, 9).counts.a.t.count).toBe(5)
        expect(setCount(data(), "a", TASK, 7, -1).counts.a.t.count).toBe(0)
    })

    it("keeps the owner's other counts", () => {
        const start = data({ counts: { a: { x: { period: 1, count: 1 } } } })

        expect(setCount(start, "a", TASK, 7, 1).counts.a.x).toEqual({
            period: 1,
            count: 1,
        })
    })
})

describe("setEntries", () => {
    it("saves what's left with its period, within the caps", () => {
        const next = setEntries(data(), "server:siel", DUNGEON, 4, {
            base: 20,
            bonus: 3,
        })

        expect(next.entries["server:siel"].d).toEqual({
            period: 4,
            base: 14,
            bonus: 3,
        })
    })
})

describe("characters", () => {
    it("adds one at the end with a trimmed name", () => {
        const next = addCharacter(data(), {
            name: "  Cael ",
            classId: "ranger",
            server: "zikel",
        })

        expect(next.characters).toHaveLength(3)
        expect(next.characters[2]).toMatchObject({
            name: "Cael",
            classId: "ranger",
            server: "zikel",
        })
        // The list has no Arena 1v1, so nothing starts ignored.
        expect(next.ignored).toEqual({})
    })

    it("starts a new character with Arena 1v1 ignored", () => {
        const next = addCharacter(data({ tasks: null }), {
            name: "Cael",
            classId: "ranger",
            server: "zikel",
        })

        expect(next.ignored).toEqual({
            [next.characters[2].id]: [...STARTS_IGNORED],
        })
    })

    it("changes one by id", () => {
        const next = updateCharacter(data(), "b", { server: "nezekan" })

        expect(next.characters[1].server).toBe("nezekan")
        expect(next.characters[0].server).toBe("siel")
    })

    it("removes one with its own counts, keeping its server's", () => {
        const start = data({
            counts: {
                a: { t: { period: 1, count: 1 } },
                "server:siel": { t: { period: 1, count: 2 } },
            },
            entries: { a: { d: { period: 1, base: 1, bonus: 0 } } },
        })
        const next = removeCharacter(start, "a")

        expect(next.characters.map((character) => character.id)).toEqual(["b"])
        expect(next.counts).toEqual({
            "server:siel": { t: { period: 1, count: 2 } },
        })
        expect(next.entries).toEqual({})
    })

    it("moves one to where another is", () => {
        expect(
            moveCharacter(data(), "b", "a").characters.map((c) => c.id),
        ).toEqual(["b", "a"])
        expect(
            moveCharacter(data(), "a", "x").characters.map((c) => c.id),
        ).toEqual(["a", "b"])
    })
})

describe("tasks", () => {
    it("copies the starter list on the first edit", () => {
        const next = addTask(data({ tasks: null }), {
            name: " Mine ",
            reset: "daily",
            cap: 2,
            shared: true,
        })

        expect(next.tasks).toHaveLength(STARTER_TASKS.length + 1)
        expect(next.tasks?.at(-1)).toMatchObject({
            name: "Mine",
            reset: "daily",
            cap: 2,
            shared: true,
        })
    })

    it("keeps caps between 1 and the maximum", () => {
        const low = updateTask(data(), "t", { ...TASK, cap: 0 })
        const high = updateTask(data(), "t", { ...TASK, cap: 5000 })

        expect(low.tasks?.[0].cap).toBe(1)
        expect(high.tasks?.[0].cap).toBe(MAX_TASK_CAP)
    })

    it("keeps a trailing space while the name is typed", () => {
        const next = updateTask(data(), "t", { ...TASK, name: "Duty " })

        expect(next.tasks?.[0].name).toBe("Duty ")
    })

    it("sets a subtitle, and drops it once emptied", () => {
        const set = updateTask(data(), "t", { ...TASK, subtitle: "Wins" })
        const cleared = updateTask(set, "t", { ...TASK, subtitle: "" })

        expect(set.tasks?.[0].subtitle).toBe("Wins")
        expect(cleared.tasks?.[0]).not.toHaveProperty("subtitle")
    })

    it("keeps an entries task's recharge when edited", () => {
        const next = updateTask(data({ tasks: [DUNGEON] }), "d", {
            ...DUNGEON,
            cap: 10,
        })

        expect(next.tasks?.[0]).toMatchObject({
            cap: 10,
            recharge: 2,
            bonusCap: 30,
        })
    })

    it("removes one with its counts and entries", () => {
        const start = data({
            counts: {
                a: { t: { period: 1, count: 1 }, x: { period: 1, count: 1 } },
            },
            entries: { "server:siel": { t: { period: 1, base: 1, bonus: 0 } } },
        })
        const next = removeTask(start, "t")

        expect(next.tasks).toEqual([])
        expect(next.counts).toEqual({ a: { x: { period: 1, count: 1 } } })
        expect(next.entries).toEqual({ "server:siel": {} })
    })

    it("moves only among tasks of its own reset and sharing", () => {
        const tasks = [
            task("w1", "weekly", false),
            task("ws", "weekly", true),
            task("d1", "daily", false),
            task("w2", "weekly", false),
        ]
        const next = moveTask(data({ tasks: tasks }), "w2", "w1")

        expect(next.tasks?.map((item) => item.id)).toEqual([
            "w2",
            "w1",
            "ws",
            "d1",
        ])
    })

    it("doesn't move a task into another group", () => {
        const start = data({
            tasks: [task("a", "weekly", false), task("b", "weekly", true)],
        })

        expect(moveTask(start, "a", "b")).toBe(start)
        expect(moveTask(start, "a", "a")).toBe(start)
    })

    it("keeps removed starter tasks to add back where they were", () => {
        const start = data({ tasks: null })
        const removed = removeTask(removeTask(start, "nightmare"), "ludra")

        expect(getRemovedPresets(start)).toEqual([])
        expect(getRemovedPresets(removed).map((item) => item.id)).toEqual([
            "nightmare",
            "ludra",
        ])

        const back = restorePreset(removed, "nightmare")

        expect(back.tasks?.map((item) => item.id)).toEqual(
            getTasks(start)
                .map((item) => item.id)
                .filter((id) => id !== "ludra"),
        )
        expect(restorePreset(back, "nightmare")).toBe(back)
        expect(restorePreset(back, "unknown")).toBe(back)
    })

    it("goes back to the starter list", () => {
        expect(restoreStarterTasks(data()).tasks).toBeNull()
    })
})

describe("setIgnored", () => {
    it("ignores and stops ignoring a task per owner", () => {
        const ignored = setIgnored(data(), "a", "t", true)

        expect(ignored.ignored).toEqual({ a: ["t"] })
        expect(setIgnored(ignored, "b", "t", true).ignored).toEqual({
            a: ["t"],
            b: ["t"],
        })
        expect(setIgnored(ignored, "a", "t", false).ignored).toEqual({})
    })

    it("is cleaned up when the character or the task goes", () => {
        const start = data({
            ignored: { a: ["t", "x"], b: ["t"] },
            minimized: ["a"],
            goalsOpen: ["a", "b"],
        })

        expect(removeCharacter(start, "a")).toMatchObject({
            ignored: { b: ["t"] },
            minimized: [],
            goalsOpen: ["b"],
        })
        expect(removeTask(start, "t").ignored).toEqual({ a: ["x"] })
    })
})

describe("setMinimized", () => {
    it("minimizes and expands cards, leaving the others", () => {
        const start = data({ minimized: ["x"] })
        const minimized = setMinimized(start, ["a", "x"], true)

        expect(minimized.minimized).toEqual(["a", "x"])
        expect(setMinimized(minimized, ["a"], false).minimized).toEqual(["x"])
    })
})

describe("setGoalsOpen", () => {
    it("opens and closes one owner's One-off box, leaving the others", () => {
        const opened = setGoalsOpen(data({ goalsOpen: ["x"] }), "a", true)

        expect(opened.goalsOpen).toEqual(["x", "a"])
        expect(setGoalsOpen(opened, "a", true).goalsOpen).toEqual(["x", "a"])
        expect(setGoalsOpen(opened, "x", false).goalsOpen).toEqual(["a"])
    })
})

describe("setMembership", () => {
    it("sets the account's membership, keeping the rest", () => {
        const before = data()
        const after = setMembership(before, false)

        expect(after.membership).toBe(false)
        expect(after.characters).toBe(before.characters)
    })
})

describe("setEnergy", () => {
    it("saves a character's energy within the account's cap", () => {
        const left = { base: 900, bonus: 2500 }

        expect(setEnergy(data(), "a", 7, left).energy).toEqual({
            a: { period: 7, base: 840, bonus: 2000 },
        })
        expect(
            setEnergy(data({ membership: false }), "a", 7, left).energy.a,
        ).toEqual({ period: 7, base: 560, bonus: 2000 })
    })

    it("is dropped with its character", () => {
        const withEnergy = setEnergy(data(), "a", 7, { base: 10, bonus: 0 })

        expect(removeCharacter(withEnergy, "a").energy).toEqual({})
    })
})

describe("setCubeKeys", () => {
    it("saves a character's keys as a whole number within the cap", () => {
        expect(setCubeKeys(data(), "a", 34).cubeKeys).toEqual({ a: 34 })
        expect(setCubeKeys(data(), "a", -2).cubeKeys).toEqual({ a: 0 })
        expect(setCubeKeys(data(), "a", 12.6).cubeKeys).toEqual({ a: 13 })
        expect(setCubeKeys(data(), "a", 99999).cubeKeys).toEqual({ a: 9999 })
    })

    it("is dropped with its character", () => {
        expect(
            removeCharacter(setCubeKeys(data(), "a", 3), "a").cubeKeys,
        ).toEqual({})
    })
})

describe("confirmArenaWeek", () => {
    // Seen this week (period 5) at 18-21 in 5v5 and 1-0 in 1v1, start unknown.
    const ARENA: TrackerData["arena"] = {
        a: {
            seen: { period: 5, at: 2, modes: { "1": [1, 0], "2": [18, 21] } },
        },
    }

    it("works the week's start back from the counts shown", () => {
        const counted = data({
            arena: ARENA,
            counts: {
                a: {
                    "arena-participation": { period: 5, count: 2 },
                    "arena-wins": { period: 5, count: 1 },
                    "arena-1v1-wins": { period: 5, count: 1 },
                    "arena-1v1-participation": { period: 5, count: 1 },
                },
            },
        })
        const next = confirmArenaWeek(counted, "a", 5)

        expect(next.arena.a.base).toEqual({
            period: 5,
            at: 2,
            modes: { "1": [0, 0], "2": [17, 20] },
        })
    })

    it("counts last week's numbers as none this week", () => {
        const next = confirmArenaWeek(
            data({
                arena: ARENA,
                counts: { a: { "arena-wins": { period: 4, count: 3 } } },
            }),
            "a",
            5,
        )

        expect(next.arena.a.base?.modes).toEqual(ARENA.a.seen.modes)
    })

    it("changes nothing in a week whose start is known", () => {
        const known = data({
            arena: { a: { ...ARENA.a, base: ARENA.a.seen } },
        })

        expect(confirmArenaWeek(known, "a", 5)).toBe(known)
    })
})

describe("declineGameCharacter", () => {
    it("remembers a declined character once, by server and name", () => {
        const once = declineGameCharacter(data(), "siel", " Kryx ")

        expect(once.declined).toEqual(["siel:kryx"])
        expect(declineGameCharacter(once, "siel", "KRYX")).toBe(once)
    })
})

describe("setNote", () => {
    it("saves a character's note trimmed, and removes an empty one", () => {
        const saved = setNote(data(), "a", {
            short: "  Alt for keys ",
            long: "Runs Shugo only\n",
        })

        expect(saved.notes).toEqual({
            a: { short: "Alt for keys", long: "Runs Shugo only" },
        })
        expect(setNote(saved, "a", { short: " ", long: "" }).notes).toEqual({})
    })

    it("is dropped with its character", () => {
        const saved = setNote(data(), "a", { short: "Main", long: "" })

        expect(removeCharacter(saved, "a").notes).toEqual({})
    })
})
