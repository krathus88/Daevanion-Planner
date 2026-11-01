// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PETS_KEY, TIMERS_KEY } from "./syncedKeys"

// An in-memory user_data table standing in for Supabase.
const remote = vi.hoisted(() => {
    return {
        rows: new Map<string, { value: unknown; updated_at: string }>(),
        uploads: [] as { key: string; value: unknown }[],
        failNext: null as string | null,
        takeFailure() {
            const message = this.failNext

            this.failNext = null

            return message === null ? null : { message: message }
        },
    }
})

const auth = vi.hoisted(() => {
    return {
        current: { status: "signedIn", userId: "user-1" } as {
            status: string
            userId?: string
        },
        listeners: new Set<() => void>(),
    }
})

vi.mock("@account/supabaseClient", () => {
    const select = (columns: string) => {
        const toRows = (keys?: string[]) => {
            const rows = []

            for (const [key, row] of remote.rows) {
                if (!keys || keys.includes(key)) {
                    rows.push(
                        columns.includes("value")
                            ? { key: key, ...row }
                            : { key: key, updated_at: row.updated_at },
                    )
                }
            }

            return rows
        }

        return {
            in: async (_column: string, keys: string[]) => {
                const error = remote.takeFailure()

                return { data: error ? null : toRows(keys), error: error }
            },
            then: (resolve: (result: unknown) => void) => {
                const error = remote.takeFailure()

                resolve({ data: error ? null : toRows(), error: error })
            },
        }
    }

    const upsert = async (
        chunk: { key: string; value: unknown; updated_at: string }[],
    ) => {
        const error = remote.takeFailure()

        if (!error) {
            for (const row of chunk) {
                remote.rows.set(row.key, {
                    value: row.value,
                    updated_at: row.updated_at,
                })
                remote.uploads.push({ key: row.key, value: row.value })
            }
        }

        return { error: error }
    }

    return {
        supabase: {
            from: () => {
                return { select: select, upsert: upsert }
            },
        },
    }
})

vi.mock("@account/auth", () => {
    return {
        readAuth: () => {
            return auth.current
        },
        subscribeToAuth: (listener: () => void) => {
            auth.listeners.add(listener)

            return () => {
                auth.listeners.delete(listener)
            }
        },
    }
})

const OLD = "2026-01-01T00:00:00.000Z"
const NEW = "2026-06-01T00:00:00.000Z"
const PLANNER_KEY = "daevanion:v1:gladiator:settings"
const SAVED_KEY = "daevanion:v1:gladiator:nezekan:saved-boards"
const META_KEY = "daevanion:sync:v1:state"

const setRemote = (key: string, value: unknown, updatedAt = OLD) => {
    remote.rows.set(key, { value: value, updated_at: updatedAt })
}

// Each test gets fresh module state: signed in once, as on a page load.
const load = async () => {
    vi.resetModules()

    const sync = await import("./cloudSync")
    const meta = await import("./syncMeta")
    const unsubscribe = sync.subscribeToSyncStatus(() => {})

    return { ...sync, ...meta, unsubscribe: unsubscribe }
}

const waitForState = async (
    sync: { readSyncStatus: () => { state: string } },
    state: string,
) => {
    await vi.waitFor(() => {
        expect(sync.readSyncStatus().state).toBe(state)
    })
}

const readJson = (key: string) => {
    return JSON.parse(localStorage.getItem(key) ?? "null")
}

// Each load's module adds a document listener it never removes, so without
// this every earlier test's copy would react (and upload) too.
const documentListeners: [string, EventListenerOrEventListenerObject][] = []
const addDocumentListener = document.addEventListener.bind(document)

beforeEach(() => {
    remote.rows.clear()
    remote.uploads.length = 0
    remote.failNext = null
    auth.current = { status: "signedIn", userId: "user-1" }
    auth.listeners.clear()
    localStorage.clear()
    vi.spyOn(document, "addEventListener").mockImplementation(
        (type: string, listener: EventListenerOrEventListenerObject) => {
            documentListeners.push([type, listener])
            addDocumentListener(type, listener)
        },
    )
})

afterEach(() => {
    for (const [type, listener] of documentListeners.splice(0)) {
        document.removeEventListener(type, listener)
    }

    vi.useRealTimers()
    vi.restoreAllMocks()
})

describe("cloudSync: first sync", () => {
    it("stays off while signed out", async () => {
        auth.current = { status: "signedOut" }

        const sync = await load()

        expect(sync.readSyncStatus()).toEqual({ state: "off" })
        expect(remote.uploads).toEqual([])
    })

    it("downloads what only the account has", async () => {
        setRemote(PETS_KEY, { levels: { 1: 2 } })

        const sync = await load()

        await waitForState(sync, "synced")

        expect(readJson(PETS_KEY)).toEqual({ levels: { 1: 2 } })
        expect(remote.uploads).toEqual([])
    })

    it("tells open pages about a download", async () => {
        const listener = vi.fn()

        window.addEventListener("storage", listener)
        setRemote(PETS_KEY, { levels: {} })

        const sync = await load()

        await waitForState(sync, "synced")
        window.removeEventListener("storage", listener)

        expect(listener).toHaveBeenCalled()
    })

    it("uploads what only this device has", async () => {
        localStorage.setItem(PETS_KEY, '{"levels":{"1":3}}')

        const sync = await load()

        await waitForState(sync, "synced")

        expect(remote.uploads).toEqual([
            { key: PETS_KEY, value: { levels: { 1: 3 } } },
        ])
        expect(sync.readSyncMeta().pending).toEqual([])
    })

    it("doesn't upload device-only keys", async () => {
        localStorage.setItem("daevanion:planner-location", "{}")
        localStorage.setItem(`${PLANNER_KEY}:board-undo`, "{}")

        const sync = await load()

        await waitForState(sync, "synced")

        expect(remote.uploads).toEqual([])
    })

    it("strips device fields from an upload", async () => {
        localStorage.setItem(TIMERS_KEY, '{"colors":{},"pinned":[["rift"]]}')

        const sync = await load()

        await waitForState(sync, "synced")

        expect(remote.uploads[0].value).toEqual({ colors: {} })
    })

    it("keeps this device's fields when downloading", async () => {
        localStorage.setItem(TIMERS_KEY, '{"colors":{"a":1},"pinned":[["x"]]}')
        localStorage.setItem(
            META_KEY,
            JSON.stringify({
                times: { [TIMERS_KEY]: 1 },
                pending: [],
                synced: { [TIMERS_KEY]: 1 },
            }),
        )
        setRemote(TIMERS_KEY, { colors: { a: 2 } })

        const sync = await load()

        await waitForState(sync, "synced")

        expect(readJson(TIMERS_KEY)).toEqual({
            colors: { a: 2 },
            pinned: [["x"]],
        })
    })

    it("matches data that's equal on both sides without a conflict", async () => {
        localStorage.setItem(PETS_KEY, '{"a":1,"b":2}')
        setRemote(PETS_KEY, { b: 2, a: 1 })

        const sync = await load()

        await waitForState(sync, "synced")

        expect(sync.readSyncMeta().synced[PETS_KEY]).toBe(Date.parse(OLD))
        expect(remote.uploads).toEqual([])
    })

    it("downloads again when a matched key is deleted here", async () => {
        localStorage.setItem(
            META_KEY,
            JSON.stringify({
                times: {},
                pending: [],
                synced: { [PETS_KEY]: Date.parse(OLD) },
            }),
        )
        setRemote(PETS_KEY, { levels: {} })

        const sync = await load()

        await waitForState(sync, "synced")

        expect(readJson(PETS_KEY)).toEqual({ levels: {} })
    })

    it("signals a storage revision only when a planner key changes", async () => {
        const listener = vi.fn()

        window.addEventListener("daevanion-storage-revision", listener)
        setRemote(PETS_KEY, { levels: {} })

        let sync = await load()

        await waitForState(sync, "synced")
        expect(listener).not.toHaveBeenCalled()

        setRemote(PLANNER_KEY, { stats: 1 })
        sync = await load()
        await waitForState(sync, "synced")
        window.removeEventListener("daevanion-storage-revision", listener)

        expect(listener).toHaveBeenCalled()
    })
})

describe("cloudSync: conflicts", () => {
    const setUpConflict = () => {
        localStorage.setItem(
            SAVED_KEY,
            JSON.stringify([{ id: "device", createdAt: 1 }]),
        )
        setRemote(SAVED_KEY, [{ id: "account", createdAt: 2 }], NEW)
    }

    it("pauses when both sides changed", async () => {
        setUpConflict()

        const sync = await load()

        await waitForState(sync, "conflict")

        const status = sync.readSyncStatus()

        expect(status).toMatchObject({ open: true })
        expect(status.state === "conflict" && status.conflicts[0].key).toBe(
            SAVED_KEY,
        )
        expect(readJson(SAVED_KEY)[0].id).toBe("device")
        expect(remote.uploads).toEqual([])
    })

    it("holds other downloads until the choice", async () => {
        setUpConflict()
        setRemote(PETS_KEY, { levels: {} })

        const sync = await load()

        await waitForState(sync, "conflict")
        expect(localStorage.getItem(PETS_KEY)).toBeNull()

        sync.resolveSyncConflict("device")
        await waitForState(sync, "synced")

        expect(readJson(PETS_KEY)).toEqual({ levels: {} })
    })

    it("does nothing else while paused", async () => {
        setUpConflict()

        const sync = await load()

        await waitForState(sync, "conflict")
        sync.retrySync()

        expect(sync.readSyncStatus().state).toBe("conflict")
    })

    it("closes and reopens the dialog", async () => {
        setUpConflict()

        const sync = await load()

        await waitForState(sync, "conflict")

        sync.closeSyncConflict()
        expect(sync.readSyncStatus()).toMatchObject({ open: false })

        sync.openSyncConflict()
        expect(sync.readSyncStatus()).toMatchObject({ open: true })
    })

    it("keep account overwrites this device", async () => {
        setUpConflict()

        const sync = await load()

        await waitForState(sync, "conflict")
        sync.resolveSyncConflict("account")
        await waitForState(sync, "synced")

        expect(readJson(SAVED_KEY)[0].id).toBe("account")
        expect(remote.uploads).toEqual([])
    })

    it("keep device overwrites the account", async () => {
        setUpConflict()

        const sync = await load()

        await waitForState(sync, "conflict")
        sync.resolveSyncConflict("device")
        await waitForState(sync, "synced")

        expect(readJson(SAVED_KEY)[0].id).toBe("device")
        expect(remote.rows.get(SAVED_KEY)?.value).toEqual([
            { id: "device", createdAt: 1 },
        ])
    })

    it("merge keeps both sides everywhere", async () => {
        setUpConflict()

        const sync = await load()

        await waitForState(sync, "conflict")
        sync.resolveSyncConflict("merge")
        await waitForState(sync, "synced")

        const ids = ["account", "device"]

        expect(
            readJson(SAVED_KEY).map((item: { id: string }) => item.id),
        ).toEqual(ids)
        expect(
            (remote.rows.get(SAVED_KEY)?.value as { id: string }[]).map(
                (item) => item.id,
            ),
        ).toEqual(ids)
    })

    it("stays clean on the next pull after a choice", async () => {
        setUpConflict()

        const sync = await load()

        await waitForState(sync, "conflict")
        sync.resolveSyncConflict("device")
        await waitForState(sync, "synced")

        sync.retrySync()
        await waitForState(sync, "synced")

        expect(sync.readSyncMeta().pending).toEqual([])
    })
})

describe("cloudSync: editing", () => {
    it("waits for a pause, then uploads a burst of edits once", async () => {
        const sync = await load()

        await waitForState(sync, "synced")
        vi.useFakeTimers()

        sync.setStoredItem(PETS_KEY, '{"levels":{"1":1}}')
        await vi.advanceTimersByTimeAsync(1000)
        sync.setStoredItem(PETS_KEY, '{"levels":{"1":2}}')
        await vi.advanceTimersByTimeAsync(1999)

        expect(remote.uploads).toEqual([])

        await vi.advanceTimersByTimeAsync(1)

        expect(remote.uploads).toEqual([
            { key: PETS_KEY, value: { levels: { 1: 2 } } },
        ])
    })

    it("uploads at once when the tab is hidden", async () => {
        const sync = await load()

        await waitForState(sync, "synced")
        sync.setStoredItem(PETS_KEY, "{}")

        vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden")
        document.dispatchEvent(new Event("visibilitychange"))

        await vi.waitFor(() => {
            expect(remote.uploads).toHaveLength(1)
        })
    })

    it("pulls other devices' edits when the tab is shown", async () => {
        const sync = await load()

        await waitForState(sync, "synced")
        setRemote(PETS_KEY, { levels: { 1: 3 } }, NEW)

        vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible")
        document.dispatchEvent(new Event("visibilitychange"))

        await vi.waitFor(() => {
            expect(readJson(PETS_KEY)).toEqual({ levels: { 1: 3 } })
        })
    })

    it("downloading isn't counted as an edit", async () => {
        setRemote(PETS_KEY, { levels: {} })

        const sync = await load()

        await waitForState(sync, "synced")

        expect(sync.readSyncMeta().pending).toEqual([])
    })
})

describe("cloudSync: failures and accounts", () => {
    it("reports the error, keeps the edit and recovers on retry", async () => {
        localStorage.setItem(PETS_KEY, "{}")
        remote.failNext = "offline"

        const sync = await load()

        await waitForState(sync, "error")

        expect(sync.readSyncStatus()).toEqual({
            state: "error",
            message: "offline",
        })

        sync.retrySync()
        await waitForState(sync, "synced")

        expect(remote.uploads).toHaveLength(1)
    })

    it("stops on sign out and syncs again on the next login", async () => {
        const sync = await load()

        await waitForState(sync, "synced")

        auth.current = { status: "signedOut" }
        auth.listeners.forEach((listener) => {
            listener()
        })
        expect(sync.readSyncStatus()).toEqual({ state: "off" })

        sync.setStoredItem(PETS_KEY, "{}")

        auth.current = { status: "signedIn", userId: "user-1" }
        auth.listeners.forEach((listener) => {
            listener()
        })
        await waitForState(sync, "synced")

        expect(remote.uploads).toHaveLength(1)
    })
})
