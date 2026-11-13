import { beforeEach, describe, expect, it, vi } from "vitest"

type Row = {
    server: string
    boss_id: string
    spawn_at: string | null
    killed_at: string | null
    reported_at: string
}

const db = vi.hoisted(() => {
    return {
        rows: [] as unknown[],
        selectError: null as object | null,
        writeError: null as object | null,
        lastUpsert: null as unknown,
        lastDelete: [] as unknown[][],
        removed: 0,
        created: 0,
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
                in: async () => {
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
                                    reported_at: "2026-01-01T00:00:00.000Z",
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
                db.created++

                return channel
            },
            removeChannel: async () => {
                db.removed++
            },
        },
    }
})

const page = vi.hoisted(() => {
    return { visible: true, listeners: new Set<() => void>() }
})

vi.mock("@common/pageVisibility", () => {
    return {
        isPageVisible: () => {
            return page.visible
        },
        subscribeToPageVisibility: (onChange: () => void) => {
            page.listeners.add(onChange)

            return () => {
                page.listeners.delete(onChange)
            }
        },
    }
})

const setVisible = (visible: boolean) => {
    page.visible = visible

    for (const listener of page.listeners) {
        listener()
    }
}

const ROW: Row = {
    server: "siel",
    boss_id: "gartua",
    spawn_at: "2026-01-01T12:00:00.000Z",
    killed_at: null,
    reported_at: "2026-01-01T11:00:00.000Z",
}

const load = async () => {
    vi.resetModules()

    return import("./sharedReports")
}

// Starts watching, then lets the initial load finish.
const watch = async (
    module: Awaited<ReturnType<typeof load>>,
    onChange: () => void = () => {},
) => {
    const unsubscribe = module.subscribeToSharedReports(["siel"], onChange)

    db.subscribed?.("SUBSCRIBED")
    await vi.waitFor(() => {
        expect(db.subscribed).not.toBeNull()
    })
    await Promise.resolve()
    await Promise.resolve()

    return unsubscribe
}

beforeEach(() => {
    db.rows = []
    db.selectError = null
    db.writeError = null
    db.lastUpsert = null
    db.lastDelete = []
    db.removed = 0
    db.created = 0
    page.visible = true
    page.listeners.clear()
    db.changeHandler = null
    db.subscribed = null
})

describe("loading", () => {
    it("turns rows into spawn reports", async () => {
        db.rows = [ROW]

        const module = await load()

        await watch(module)

        expect(module.readSharedReports()).toEqual({
            "siel/gartua": {
                report: {
                    spawnAt: Date.parse(ROW.spawn_at as string),
                    reportedAt: Date.parse(ROW.reported_at),
                },
                reportedAt: Date.parse(ROW.reported_at),
            },
        })
    })

    it("turns rows into kill reports", async () => {
        db.rows = [
            {
                ...ROW,
                spawn_at: null,
                killed_at: "2026-01-01T13:00:00.000Z",
            },
        ]

        const module = await load()

        await watch(module)

        expect(module.readSharedReports()["siel/gartua"]?.report).toEqual({
            killedAt: Date.parse("2026-01-01T13:00:00.000Z"),
        })
    })

    it("keeps nothing when the load fails", async () => {
        db.rows = [ROW]
        db.selectError = { message: "offline" }

        const module = await load()

        await watch(module)

        expect(module.readSharedReports()).toEqual({})
    })

    it("tells listeners when data arrives", async () => {
        const onChange = vi.fn()

        db.rows = [ROW]

        const module = await load()

        await watch(module, onChange)

        expect(onChange).toHaveBeenCalled()
    })
})

describe("live changes", () => {
    it("adds rows for watched scopes only", async () => {
        const module = await load()

        await watch(module)

        db.changeHandler?.({ eventType: "INSERT", new: ROW })
        db.changeHandler?.({
            eventType: "INSERT",
            new: { ...ROW, server: "other" },
        })

        expect(Object.keys(module.readSharedReports())).toEqual(["siel/gartua"])
    })

    it("removes deleted rows", async () => {
        db.rows = [ROW]

        const module = await load()

        await watch(module)

        db.changeHandler?.({ eventType: "DELETE", old: ROW })

        expect(module.readSharedReports()).toEqual({})
    })
})

describe("subscribing", () => {
    it("stops and forgets after the last listener leaves", async () => {
        db.rows = [ROW]

        const module = await load()
        const unsubscribe = await watch(module)

        unsubscribe()

        expect(db.removed).toBe(1)
        expect(module.readSharedReports()).toEqual({})
    })

    it("keeps one channel for the same scopes", async () => {
        const module = await load()

        module.subscribeToSharedReports(["siel"], () => {})
        module.subscribeToSharedReports(["siel"], () => {})

        expect(db.removed).toBe(0)
    })

    it("swaps channels for new scopes", async () => {
        const module = await load()

        module.subscribeToSharedReports(["siel"], () => {})
        module.subscribeToSharedReports(["other"], () => {})

        expect(db.removed).toBe(1)
    })
})

describe("writeSharedReport", () => {
    it("writes a spawn report", async () => {
        const module = await load()
        const spawnAt = Date.parse("2026-02-01T00:00:00.000Z")

        expect(
            await module.writeSharedReport("siel", "gartua", {
                spawnAt: spawnAt,
                reportedAt: 1,
            }),
        ).toBe(true)
        expect(db.lastUpsert).toEqual({
            server: "siel",
            boss_id: "gartua",
            spawn_at: "2026-02-01T00:00:00.000Z",
            killed_at: null,
        })
    })

    it("writes a kill report", async () => {
        const module = await load()

        await module.writeSharedReport("siel", "gartua", { killedAt: 0 })

        expect(db.lastUpsert).toMatchObject({
            spawn_at: null,
            killed_at: new Date(0).toISOString(),
        })
    })

    it("deletes when the report is cleared", async () => {
        const module = await load()

        expect(await module.writeSharedReport("siel", "gartua", null)).toBe(
            true,
        )
        expect(db.lastDelete).toEqual([
            ["server", "siel"],
            ["boss_id", "gartua"],
        ])
    })

    it("resolves false when the database refuses", async () => {
        db.writeError = { message: "not allowed" }

        const module = await load()

        expect(
            await module.writeSharedReport("siel", "gartua", { killedAt: 0 }),
        ).toBe(false)
        expect(await module.writeSharedReport("siel", "gartua", null)).toBe(
            false,
        )
    })

    it("updates a watched scope straight away", async () => {
        const module = await load()

        await watch(module)
        await module.writeSharedReport("siel", "gartua", { killedAt: 0 })

        expect(module.readSharedReports()["siel/gartua"]).toBeDefined()

        await module.writeSharedReport("siel", "gartua", null)

        expect(module.readSharedReports()["siel/gartua"]).toBeUndefined()
    })
})

describe("a hidden page", () => {
    it("closes the channel and keeps the reports", async () => {
        db.rows = [ROW]

        const module = await load()

        await watch(module)
        setVisible(false)

        expect(db.removed).toBe(1)
        expect(module.readSharedReports()["siel/gartua"]).toBeDefined()
    })

    it("reconnects and reloads once shown again", async () => {
        const module = await load()
        const onChange = vi.fn()

        await watch(module, onChange)
        setVisible(false)
        db.rows = [ROW]
        setVisible(true)

        expect(db.created).toBe(2)

        db.subscribed?.("SUBSCRIBED")
        await vi.waitFor(() => {
            expect(module.readSharedReports()["siel/gartua"]).toBeDefined()
        })
    })

    it("opens no channel until shown", async () => {
        page.visible = false

        const module = await load()

        module.subscribeToSharedReports(["siel"], () => {})

        expect(db.created).toBe(0)

        setVisible(true)

        expect(db.created).toBe(1)
    })
})
