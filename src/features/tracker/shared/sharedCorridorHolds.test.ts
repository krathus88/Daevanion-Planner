import { beforeEach, describe, expect, it, vi } from "vitest"

const db = vi.hoisted(() => {
    return {
        rows: [] as unknown[],
        selectError: null as object | null,
        removed: 0,
        changeHandler: null as ((payload: unknown) => void) | null,
        subscribed: null as ((status: string) => void) | null,
    }
})

vi.mock("@account/supabaseClient", () => {
    const channel = {
        on: (_event: string, _filter: object, handler: () => void) => {
            db.changeHandler = handler

            return channel
        },
        subscribe: (callback: (status: string) => void) => {
            db.subscribed = callback

            return channel
        },
    }

    return {
        supabase: {
            from: () => {
                return {
                    select: async () => {
                        return { data: db.rows, error: db.selectError }
                    },
                }
            },
            channel: () => {
                return channel
            },
            removeChannel: async () => {
                db.removed++
            },
        },
    }
})

const SIEGE_END = "2026-11-12T20:13:24+00:00"

const ROW = {
    server: 1301,
    siege_end: SIEGE_END,
    artifacts: { "1001": 1, "1002": 1, "1003": 2 },
}

const load = async () => {
    vi.resetModules()

    return import("./sharedCorridorHolds")
}

// Starts watching, then lets the first load finish.
const watch = async (
    module: Awaited<ReturnType<typeof load>>,
    onChange: () => void = () => {},
) => {
    const unsubscribe = module.subscribeToSharedCorridorHolds(onChange)

    db.subscribed?.("SUBSCRIBED")
    await vi.waitFor(() => {
        expect(module.readSharedCorridorHolds()).not.toEqual([])
    })

    return unsubscribe
}

beforeEach(() => {
    db.rows = [ROW]
    db.selectError = null
    db.removed = 0
    db.changeHandler = null
    db.subscribed = null
})

describe("shared corridor holds", () => {
    it("loads every server's holdings", async () => {
        const module = await load()

        await watch(module)

        expect(module.readSharedCorridorHolds()).toEqual([
            {
                server: 1301,
                siegeEnd: Date.parse(SIEGE_END),
                artifacts: ROW.artifacts,
            },
        ])
    })

    it("skips rows it can't read and factions that aren't numbers", async () => {
        db.rows = [
            { ...ROW, artifacts: { "1001": 1, "1002": "x" } },
            { ...ROW, server: 1302, siege_end: "not a time" },
            { ...ROW, server: 1303, artifacts: null },
        ]

        const module = await load()

        await watch(module)

        expect(module.readSharedCorridorHolds()).toEqual([
            {
                server: 1301,
                siegeEnd: Date.parse(SIEGE_END),
                artifacts: { "1001": 1 },
            },
        ])
    })

    it("follows a server's new siege and adds new servers", async () => {
        const module = await load()
        const onChange = vi.fn()
        const later = "2026-11-14T20:10:00+00:00"

        await watch(module, onChange)
        db.changeHandler?.({
            eventType: "UPDATE",
            new: { ...ROW, siege_end: later, artifacts: { "1001": 2 } },
        })
        db.changeHandler?.({
            eventType: "INSERT",
            new: { ...ROW, server: 2301 },
        })

        expect(module.readSharedCorridorHolds()).toEqual([
            {
                server: 1301,
                siegeEnd: Date.parse(later),
                artifacts: { "1001": 2 },
            },
            {
                server: 2301,
                siegeEnd: Date.parse(SIEGE_END),
                artifacts: ROW.artifacts,
            },
        ])
        expect(onChange).toHaveBeenCalledTimes(3)
    })

    it("keeps nothing when the table can't be read", async () => {
        db.selectError = { message: "relation does not exist" }

        const module = await load()

        module.subscribeToSharedCorridorHolds(() => {})
        db.subscribed?.("SUBSCRIBED")
        await Promise.resolve()

        expect(module.readSharedCorridorHolds()).toEqual([])
    })

    it("stops watching once nobody listens", async () => {
        const module = await load()
        const unsubscribe = await watch(module)

        unsubscribe()

        expect(db.removed).toBe(1)
        expect(module.readSharedCorridorHolds()).toEqual([])
    })
})
