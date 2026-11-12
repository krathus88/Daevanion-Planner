// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { readCompanionStatus } from "./companionStatus"

// The status row in the account, the Realtime listener the page has open,
// and how often the row was read.
const mocks = vi.hoisted(() => {
    return {
        row: null as unknown,
        reads: 0,
        authListeners: new Set<() => void>(),
        live: null as ((payload: unknown) => void) | null,
        connect: null as ((state: string) => void) | null,
    }
})

vi.mock("@account/supabaseClient", () => {
    const query = {
        select: () => {
            return query
        },
        eq: () => {
            return query
        },
        maybeSingle: () => {
            mocks.reads++

            return Promise.resolve({
                data: mocks.row === null ? null : { value: mocks.row },
                error: null,
            })
        },
    }
    const channel = {
        on: (
            _type: string,
            _filter: unknown,
            listener: (payload: unknown) => void,
        ) => {
            mocks.live = listener

            return channel
        },
        subscribe: (callback: (state: string) => void) => {
            mocks.connect = callback

            return channel
        },
    }

    return {
        supabase: {
            from: () => {
                return query
            },
            channel: () => {
                return channel
            },
            removeChannel: async () => {
                mocks.live = null
            },
        },
    }
})

vi.mock("@account/auth", () => {
    return {
        readAuth: () => {
            return { status: "signedIn", userId: "user" }
        },
        subscribeToAuth: (listener: () => void) => {
            mocks.authListeners.add(listener)

            return () => {
                mocks.authListeners.delete(listener)
            }
        },
    }
})

const NOW = Date.UTC(2026, 10, 12, 2)
const CHARACTER = { name: "Testchar", server: 1301, class: 30 }

describe("readCompanionStatus", () => {
    it("is running while the row is fresh", () => {
        expect(
            readCompanionStatus(
                { v: 1, running: true, at: NOW - 60_000, character: CHARACTER },
                NOW,
            ),
        ).toEqual({ state: "running", character: CHARACTER })
    })

    it("is running without a character until the game names one", () => {
        expect(
            readCompanionStatus(
                { v: 1, running: true, at: NOW, character: null },
                NOW,
            ),
        ).toEqual({ state: "running", character: null })
    })

    it("is stopped when closed, stale or missing", () => {
        expect(
            readCompanionStatus({ v: 1, running: false, at: NOW }, NOW),
        ).toEqual({ state: "stopped" })
        // A crash never says so: the row just stops being refreshed.
        expect(
            readCompanionStatus(
                { v: 1, running: true, at: NOW - 4 * 60_000 },
                NOW,
            ),
        ).toEqual({ state: "stopped" })
        expect(readCompanionStatus(null, NOW)).toEqual({ state: "stopped" })
        expect(
            readCompanionStatus({ v: 2, running: true, at: NOW }, NOW),
        ).toEqual({ state: "stopped" })
    })
})

const STATUS_KEY = "daevanion:companion:v1:status"

// Fresh module state per test, subscribed and connected like a page load.
const watch = async (row: unknown) => {
    vi.resetModules()
    mocks.row = row
    mocks.reads = 0
    const companion = await import("./companionStatus")
    const unsubscribe = companion.subscribeToCompanionStatus(() => {})

    mocks.connect?.("SUBSCRIBED")
    await vi.waitFor(() => {
        expect(companion.readCompanionStatusNow().state).not.toBe("unknown")
    })

    return { ...companion, unsubscribe: unsubscribe }
}

const statusUpdate = (value: unknown) => {
    mocks.live?.({
        eventType: "UPDATE",
        new: { key: STATUS_KEY, value: value },
        old: {},
    })
}

describe("subscribeToCompanionStatus", () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it("reads the row once on connecting, then only listens", async () => {
        const companion = await watch({
            v: 1,
            running: true,
            at: Date.now(),
            character: CHARACTER,
        })

        expect(companion.readCompanionStatusNow()).toEqual({
            state: "running",
            character: CHARACTER,
        })

        statusUpdate({ v: 1, running: false, at: Date.now() })

        expect(companion.readCompanionStatusNow()).toEqual({
            state: "stopped",
        })
        expect(mocks.reads).toBe(1)
    })

    it("keeps the status through a token refresh for the same user", async () => {
        const companion = await watch({ v: 1, running: true, at: Date.now() })

        for (const listener of mocks.authListeners) {
            listener()
        }

        expect(companion.readCompanionStatusNow().state).toBe("running")
    })

    it("ignores the account's other rows", async () => {
        const companion = await watch({ v: 1, running: false, at: Date.now() })

        mocks.live?.({
            eventType: "UPDATE",
            new: { key: "daevanion:game:v1:1301:Kryx", value: {} },
            old: {},
        })

        expect(companion.readCompanionStatusNow()).toEqual({
            state: "stopped",
        })
    })

    it("counts a running app as stopped once its updates stop coming", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })

        const companion = await watch({ v: 1, running: true, at: Date.now() })

        expect(companion.readCompanionStatusNow().state).toBe("running")

        await vi.advanceTimersByTimeAsync(3 * 60_000 + 2000)

        expect(companion.readCompanionStatusNow()).toEqual({
            state: "stopped",
        })
    })

    it("stops listening once no page shows it", async () => {
        const companion = await watch(null)

        companion.unsubscribe()

        expect(mocks.live).toBeNull()
    })
})
