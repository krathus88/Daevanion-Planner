// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import {
    isUnsynced,
    markEdited,
    markSynced,
    readSyncMeta,
    setStoredItem,
    subscribeToLocalChanges,
    writeSyncMeta,
} from "./syncMeta"
import { PETS_KEY, TIMERS_KEY } from "./syncedKeys"

afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
})

describe("readSyncMeta", () => {
    it("starts empty", () => {
        expect(readSyncMeta()).toEqual({ times: {}, pending: [], synced: {} })
    })

    it("reads back what was written", () => {
        const meta = { times: { a: 1 }, pending: ["a"], synced: { a: 1 } }

        writeSyncMeta(meta)

        expect(readSyncMeta()).toEqual(meta)
    })

    it.each(["not json", "[]", '{"times":1,"pending":[]}'])(
        "starts over on %s",
        (raw) => {
            localStorage.setItem("daevanion:sync:v1:state", raw)

            expect(readSyncMeta().pending).toEqual([])
        },
    )

    it("reads a save from before synced existed", () => {
        localStorage.setItem(
            "daevanion:sync:v1:state",
            '{"times":{},"pending":[]}',
        )

        expect(readSyncMeta().synced).toEqual({})
    })
})

describe("meta helpers", () => {
    it("markEdited queues a key once", () => {
        const meta = readSyncMeta()

        markEdited(meta, "a", 1)
        markEdited(meta, "a", 2)

        expect(meta.pending).toEqual(["a"])
        expect(meta.times.a).toBe(2)
    })

    it("markSynced clears the queue and records the version", () => {
        const meta = readSyncMeta()

        markEdited(meta, "a", 1)
        markSynced(meta, "a", 5)

        expect(meta).toEqual({
            times: { a: 5 },
            pending: [],
            synced: { a: 5 },
        })
    })

    it("isUnsynced covers pending and never-matched keys", () => {
        const meta = {
            times: {},
            pending: ["edited"],
            synced: { edited: 1, clean: 1 },
        }

        expect(isUnsynced(meta, "edited")).toBe(true)
        expect(isUnsynced(meta, "never")).toBe(true)
        expect(isUnsynced(meta, "clean")).toBe(false)
    })
})

describe("setStoredItem", () => {
    it("saves and queues a synced key", () => {
        setStoredItem(PETS_KEY, "{}")

        expect(localStorage.getItem(PETS_KEY)).toBe("{}")
        expect(readSyncMeta().pending).toEqual([PETS_KEY])
    })

    it("saves a device-only key without queueing it", () => {
        setStoredItem("daevanion:planner-location", "x")

        expect(localStorage.getItem("daevanion:planner-location")).toBe("x")
        expect(readSyncMeta().pending).toEqual([])
    })

    it("doesn't count saving identical text as an edit", () => {
        localStorage.setItem(PETS_KEY, "{}")
        setStoredItem(PETS_KEY, "{}")

        expect(readSyncMeta().pending).toEqual([])
    })

    it("doesn't count a change to device fields only", () => {
        localStorage.setItem(TIMERS_KEY, '{"colors":{},"pinned":[]}')
        setStoredItem(TIMERS_KEY, '{"colors":{},"pinned":[["rift"]]}')

        expect(localStorage.getItem(TIMERS_KEY)).toContain("rift")
        expect(readSyncMeta().pending).toEqual([])
    })

    it("counts a change to the fields the account keeps", () => {
        localStorage.setItem(TIMERS_KEY, '{"colors":{}}')
        setStoredItem(TIMERS_KEY, '{"colors":{"a":1}}')

        expect(readSyncMeta().pending).toEqual([TIMERS_KEY])
    })

    it("tells listeners about edits until they unsubscribe", () => {
        const listener = vi.fn()
        const unsubscribe = subscribeToLocalChanges(listener)

        setStoredItem(PETS_KEY, "1")
        unsubscribe()
        setStoredItem(PETS_KEY, "2")

        expect(listener).toHaveBeenCalledTimes(1)
    })
})
