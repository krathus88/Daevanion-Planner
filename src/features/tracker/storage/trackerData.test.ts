// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { readSyncMeta } from "@account/sync/syncMeta"
import { STARTS_IGNORED } from "@tracker/config/starterTasks"
import { STARTER_IDS } from "@tracker/logic/presetTasks"
import type { TrackerData } from "@tracker/types"
import {
    parseTrackerData,
    readTrackerData,
    subscribeToTrackerData,
    writeTrackerData,
} from "./trackerData"

const KEY = "daevanion:tracker:v1:data"

const DATA: TrackerData = {
    characters: [{ id: "a", name: "Aria", classId: "cleric", server: "zikel" }],
    tasks: [
        { id: "t", name: "Task", reset: "daily", cap: 3, shared: false },
        {
            id: "d",
            name: "Dungeon",
            reset: "daily",
            cap: 14,
            shared: true,
            recharge: 2,
            bonusCap: 30,
        },
    ],
    presets: STARTER_IDS,
    counts: { a: { t: { period: 4, count: 2 } } },
    entries: { "server:zikel": { d: { period: 4, base: 6, bonus: 1 } } },
    minimized: ["a"],
    goalsOpen: ["a"],
    ignored: { a: ["t"] },
    energy: { a: { period: 9, base: 400, bonus: 40 } },
    notes: { a: { short: "Alt for keys", long: "" } },
    cubeKeys: {},
    arena: {},
    declined: [],
    membership: false,
}

afterEach(() => {
    vi.restoreAllMocks()
    // A failed save stays cached under raw null. Reading other text drops it,
    // so it can't leak into the next test.
    localStorage.setItem(KEY, "{}")
    readTrackerData()
    localStorage.clear()
})

describe("parseTrackerData", () => {
    it("reads a full save", () => {
        expect(parseTrackerData(DATA)).toEqual(DATA)
    })

    it("drops bad entries one by one", () => {
        const parsed = parseTrackerData({
            characters: [
                DATA.characters[0],
                { id: "x", name: "No class", classId: "farmer" },
                { ...DATA.characters[0], name: "Same id" },
            ],
            tasks: [
                DATA.tasks?.[0],
                DATA.tasks?.[1],
                { id: "z", name: "Zero cap", reset: "daily", cap: 0 },
                { id: "m", name: "Monthly", reset: "monthly", cap: 1 },
            ],
            presets: STARTER_IDS,
            counts: {
                a: {
                    t: { period: 4, count: 2 },
                    bad: { period: 4, count: -1 },
                    half: { period: 4, count: 1.5 },
                },
                b: "nope",
            },
            entries: {
                "server:zikel": {
                    d: { period: 4, base: 6, bonus: 1 },
                    bad: { period: 4, base: -2, bonus: 0 },
                },
            },
            minimized: ["a", 3, null],
            goalsOpen: ["a", 7],
            ignored: { a: ["t", 4], b: "nope", c: [] },
            energy: {
                a: { period: 9, base: 400, bonus: 40 },
                b: { period: 9, base: -1, bonus: 0 },
                c: "full",
            },
            notes: {
                a: { short: "Alt for keys", long: 5 },
                b: { short: "  ", long: "" },
                c: "nope",
            },
            cubeKeys: { a: 34, b: -1, c: 1.5, d: "x", e: 10000 },
            arena: {
                a: {
                    seen: {
                        period: 5,
                        at: 2,
                        modes: { "2": [18, 21], x: [1] },
                    },
                    base: "x",
                },
                b: { seen: { period: -1, at: 2, modes: {} } },
            },
            declined: ["siel:kryx", 5],
            membership: false,
        })

        expect(parsed).toEqual({
            ...DATA,
            cubeKeys: { a: 34 },
            declined: ["siel:kryx"],
            arena: {
                a: { seen: { period: 5, at: 2, modes: { "2": [18, 21] } } },
            },
        })
    })

    it("fills in what older saves lack", () => {
        const parsed = parseTrackerData({
            characters: [{ id: "a", name: "Aria", classId: "cleric" }],
            tasks: [{ id: "t", name: "Task", reset: "daily", cap: 3 }],
        })

        expect(parsed.characters[0].server).toBe("siel")
        expect(parsed.tasks?.[0]).toEqual({
            id: "t",
            name: "Task",
            reset: "daily",
            cap: 3,
            shared: false,
        })
        // Starter tasks that came out later join the user's own list.
        expect(parsed.tasks?.map((task) => task.id)).toEqual([
            "t",
            "invasion",
            "arena-1v1-wins",
            "arena-1v1-participation",
            "corridors",
            "crystals-nightmare",
            "crystals-shugo",
            "shards-nightmare",
            "shards-shugo",
            "shards-abyss",
        ])
        expect(parsed.presets).toEqual(STARTER_IDS)
        expect(parsed.entries).toEqual({})
        expect(parsed.minimized).toEqual([])
        // The One-off box starts closed.
        expect(parsed.goalsOpen).toEqual([])
        // Arena 1v1 joins ignored.
        expect(parsed.ignored).toEqual({ a: [...STARTS_IGNORED] })
        expect(parsed.energy).toEqual({})
        expect(parsed.membership).toBe(true)
    })

    it("ignores new starter tasks that start ignored, once, for every character", () => {
        const known = STARTER_IDS.filter((id) => !STARTS_IGNORED.includes(id))
        const parsed = parseTrackerData({
            characters: [
                DATA.characters[0],
                { ...DATA.characters[0], id: "b" },
            ],
            tasks: null,
            presets: known,
            ignored: { a: ["t"] },
        })

        expect(parsed.ignored).toEqual({
            a: ["t", ...STARTS_IGNORED],
            b: [...STARTS_IGNORED],
        })

        // Unignored after that, it stays unignored.
        expect(
            parseTrackerData({ ...parsed, ignored: { a: ["t"] } }).ignored,
        ).toEqual({ a: ["t"] })
    })

    it("adds starter tasks newer than the save to the user's own list, once", () => {
        const task = { id: "t", name: "Task", reset: "daily", cap: 3 }
        const known = STARTER_IDS.filter((id) => id !== "nightmare")
        const parsed = parseTrackerData({
            tasks: [task, { ...task, id: "duty-missions" }],
            presets: known,
        })

        expect(parsed.tasks?.map((item) => item.id)).toEqual([
            "t",
            "nightmare",
            "duty-missions",
        ])

        // Removed after that, it stays removed.
        expect(
            parseTrackerData({ tasks: [task], presets: parsed.presets }).tasks,
        ).toHaveLength(1)
    })

    it("keeps a task's subtitle, but not an empty or odd one", () => {
        const task = { id: "t", name: "Arena", reset: "weekly", cap: 30 }
        const parsed = parseTrackerData({
            tasks: [
                { ...task, subtitle: "Wins" },
                { ...task, id: "e", subtitle: "" },
                { ...task, id: "n", subtitle: 3 },
            ],
            presets: STARTER_IDS,
        })

        expect(parsed.tasks?.map((item) => item.subtitle)).toEqual([
            "Wins",
            undefined,
            undefined,
        ])
    })

    it("gives an own copy of a starter task its entries, keeping the rest", () => {
        const parsed = parseTrackerData({
            tasks: [
                {
                    id: "ascension-trial",
                    name: "Trial",
                    reset: "weekly",
                    cap: 3,
                },
                // Its own entries setup stays.
                {
                    id: "nightmare",
                    name: "Nightmare",
                    reset: "daily",
                    cap: 10,
                    recharge: 1,
                    bonusCap: 5,
                },
                { id: "duty-missions", name: "Duty", reset: "daily", cap: 5 },
            ],
            presets: STARTER_IDS,
        })

        expect(parsed.tasks).toEqual([
            {
                id: "ascension-trial",
                name: "Trial",
                reset: "weekly",
                cap: 3,
                shared: false,
                recharge: 3,
                bonusCap: 30,
            },
            {
                id: "nightmare",
                name: "Nightmare",
                reset: "daily",
                cap: 10,
                shared: false,
                recharge: 1,
                bonusCap: 5,
            },
            {
                id: "duty-missions",
                name: "Duty",
                reset: "daily",
                cap: 5,
                shared: false,
            },
        ])
    })

    it("keeps an empty own list apart from the starter list", () => {
        expect(
            parseTrackerData({ tasks: [], presets: STARTER_IDS }).tasks,
        ).toEqual([])
        expect(parseTrackerData({}).tasks).toBeNull()
    })
})

describe("readTrackerData", () => {
    it("starts empty", () => {
        expect(readTrackerData()).toEqual({
            characters: [],
            tasks: null,
            presets: STARTER_IDS,
            counts: {},
            entries: {},
            minimized: [],
            goalsOpen: [],
            ignored: {},
            energy: {},
            notes: {},
            cubeKeys: {},
            arena: {},
            declined: [],
            membership: true,
        })
    })

    it("falls back to empty on unreadable data", () => {
        localStorage.setItem(KEY, "{")

        expect(readTrackerData().characters).toEqual([])
    })

    it("returns the same object until the data changes", () => {
        localStorage.setItem(KEY, JSON.stringify(DATA))

        expect(readTrackerData()).toBe(readTrackerData())
    })
})

describe("writeTrackerData", () => {
    it("saves, notifies and queues the upload", () => {
        const onChange = vi.fn()
        const unsubscribe = subscribeToTrackerData(onChange)

        writeTrackerData(DATA)

        expect(readTrackerData()).toEqual(DATA)
        expect(onChange).toHaveBeenCalledTimes(1)
        expect(readSyncMeta().pending).toContain(KEY)
        unsubscribe()
    })

    it("hands back the object it wrote, so unchanged parts keep their identity", () => {
        writeTrackerData(DATA)

        const next = { ...DATA, counts: { ...DATA.counts, b: {} } }

        writeTrackerData(next)

        expect(readTrackerData()).toBe(next)
        expect(readTrackerData().counts.a).toBe(DATA.counts.a)
    })

    it("hears other tabs", () => {
        const onChange = vi.fn()
        const unsubscribe = subscribeToTrackerData(onChange)

        window.dispatchEvent(new StorageEvent("storage", { key: KEY }))
        window.dispatchEvent(new StorageEvent("storage", { key: "other" }))

        expect(onChange).toHaveBeenCalledTimes(1)
        unsubscribe()
    })

    it("keeps the change for this session when storage fails", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full")
        })

        writeTrackerData(DATA)

        expect(readTrackerData()).toEqual(DATA)
    })
})
