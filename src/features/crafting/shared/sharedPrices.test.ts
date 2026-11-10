import { beforeEach, describe, expect, it, vi } from "vitest"

type Row = {
    server: string
    item_id: number
    price: number
    updated_at: string
}

const db = vi.hoisted(() => {
    return {
        rows: [] as unknown[],
        selectError: null as object | null,
        writeError: null as object | null,
        lastUpsert: null as unknown,
        lastDelete: [] as unknown[][],
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

    const table = {
        select: () => {
            return {
                eq: async () => {
                    return { data: db.rows, error: db.selectError }
                },
            }
        },
        delete: () => {
            const calls: unknown[][] = []
            const chain = {
                eq: (...args: unknown[]) => {
                    calls.push(args)
                    db.lastDelete = calls

                    return chain
                },
                then: (resolve: (result: unknown) => void) => {
                    resolve({ error: db.writeError })
                },
            }

            return chain
        },
        upsert: (row: Record<string, unknown>) => {
            db.lastUpsert = row

            return {
                select: () => {
                    return {
                        single: async () => {
                            return {
                                data: {
                                    ...row,
                                    updated_at: "2026-11-10T12:00:00.000Z",
                                },
                                error: db.writeError,
                            }
                        },
                    }
                },
            }
        },
    }

    return {
        supabase: {
            from: () => {
                return table
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

const ROW: Row = {
    server: "siel",
    item_id: 7,
    price: 1500,
    updated_at: "2026-11-10T11:00:00.000Z",
}

const load = async () => {
    vi.resetModules()

    return import("./sharedPrices")
}

// Starts watching Siel, then lets the first load finish.
const watch = async (
    module: Awaited<ReturnType<typeof load>>,
    onChange: () => void = () => {},
) => {
    const unsubscribe = module.subscribeToSharedPrices("siel", onChange)

    db.subscribed?.("SUBSCRIBED")
    await vi.waitFor(() => {
        expect(module.readSharedPrices()).not.toEqual({})
    })

    return unsubscribe
}

beforeEach(() => {
    db.rows = [ROW]
    db.selectError = null
    db.writeError = null
    db.lastUpsert = null
    db.lastDelete = []
    db.removed = 0
    db.changeHandler = null
    db.subscribed = null
})

describe("shared prices", () => {
    it("loads the server's prices by item", async () => {
        const module = await load()

        await watch(module)

        expect(module.readSharedPrices()).toEqual({
            7: { value: 1500, at: Date.parse(ROW.updated_at) },
        })
    })

    it("follows changes on the server watched, not others", async () => {
        const module = await load()
        const onChange = vi.fn()

        await watch(module, onChange)
        db.changeHandler?.({
            eventType: "UPDATE",
            new: { ...ROW, price: 2000 },
        })
        db.changeHandler?.({
            eventType: "INSERT",
            new: { ...ROW, server: "israphel", item_id: 8 },
        })

        expect(module.readSharedPrices()[7]?.value).toBe(2000)
        expect(module.readSharedPrices()[8]).toBeUndefined()

        db.changeHandler?.({
            eventType: "DELETE",
            old: { server: "siel", item_id: 7 },
        })

        expect(module.readSharedPrices()).toEqual({})
        expect(onChange).toHaveBeenCalledTimes(3)
    })

    it("stops watching once nobody listens", async () => {
        const module = await load()
        const unsubscribe = await watch(module)

        unsubscribe()

        expect(db.removed).toBe(1)
        expect(module.readSharedPrices()).toEqual({})
    })

    it("shares a price and shows it at once", async () => {
        const module = await load()

        await watch(module)

        expect(await module.writeSharedPrice("siel", 9, 300)).toBe(true)
        expect(db.lastUpsert).toEqual({
            server: "siel",
            item_id: 9,
            price: 300,
        })
        expect(module.readSharedPrices()[9]?.value).toBe(300)
    })

    it("removes a price cleared", async () => {
        const module = await load()

        await watch(module)

        expect(await module.writeSharedPrice("siel", 7, null)).toBe(true)
        expect(db.lastDelete).toEqual([
            ["server", "siel"],
            ["item_id", 7],
        ])
        expect(module.readSharedPrices()[7]).toBeUndefined()
    })

    it("reports a refused write and keeps what was there", async () => {
        const module = await load()

        await watch(module)
        db.writeError = { message: "permission denied" }

        expect(await module.writeSharedPrice("siel", 7, 1)).toBe(false)
        expect(module.readSharedPrices()[7]?.value).toBe(1500)
    })
})
