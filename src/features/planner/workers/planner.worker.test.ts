// @vitest-environment jsdom
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest"
import { makeLayout } from "@test/boardFixture"

type Posted = {
    type: string
    message?: string
    result?: {
        ok: boolean
        path?: string[]
        cost?: number
        extended?: boolean
        reason?: string
    }
}

const posted: Posted[] = []
const layout = makeLayout(undefined, {
    nodeStats: { "0,1": "attack", "1,1": "attack" },
})
const start = { row: 0, column: 0 }

const baseMessage = {
    type: "start",
    layout: layout,
    start: start,
    targets: ["0,2"],
    stallMs: 5,
    statTiers: { attack: "best" },
    spendLeftover: false,
    availablePoints: 50,
    priorities: { weights: [], focusGroups: [] },
    growStats: false,
}

// Runs the worker's message handler and waits for its last message.
const run = async (overrides: object) => {
    posted.length = 0
    window.dispatchEvent(
        new MessageEvent("message", {
            data: { ...baseMessage, ...overrides },
        }),
    )
    await vi.waitFor(() => {
        const last = posted.at(-1)

        expect(last?.type === "done" || last?.type === "error").toBe(true)
    })

    return posted
}

const lastCandidate = (messages: Posted[]) => {
    return messages.filter((message) => message.type === "candidate").at(-1)
        ?.result
}

beforeEach(() => {
    vi.stubGlobal("postMessage", (message: Posted) => {
        posted.push(message)
    })
})

afterEach(() => {
    vi.unstubAllGlobals()
})

beforeAll(async () => {
    await import("./planner.worker")
})

describe("planner worker", () => {
    it("reports candidates, then finishes", async () => {
        const messages = await run({})

        expect(lastCandidate(messages)).toMatchObject({ ok: true, cost: 4 })
        expect(messages.at(-1)).toMatchObject({
            type: "done",
            result: { ok: true },
        })
    })

    it("sends paths as lists, which survive postMessage", async () => {
        const messages = await run({})

        expect(Array.isArray(lastCandidate(messages)?.path)).toBe(true)
    })

    it("passes on why it failed", async () => {
        const messages = await run({ targets: [] })

        expect(messages.at(-1)).toMatchObject({
            type: "done",
            result: {
                ok: false,
                reason: "Select at least one node to plan a route.",
            },
        })
    })

    it("spends leftover points on stat nodes when asked", async () => {
        const messages = await run({
            spendLeftover: true,
            stallMs: 200,
        })
        const candidate = lastCandidate(messages)

        expect(candidate?.extended).toBe(true)
        expect(candidate?.path).toContain("1,1")
    })

    it("doesn't spend leftovers with no room", async () => {
        const messages = await run({
            spendLeftover: true,
            availablePoints: 4,
        })

        expect(lastCandidate(messages)?.cost).toBe(4)
    })

    it("grows along focus groups", async () => {
        const messages = await run({
            priorities: {
                weights: [],
                focusGroups: [
                    {
                        wanted: ["1,1"],
                        free: ["1,1"],
                        waiting: [],
                        detour: 0,
                    },
                ],
            },
        })
        const candidate = lastCandidate(messages)

        expect(candidate?.extended).toBe(true)
        expect(candidate?.path).toContain("1,1")
        expect(candidate?.cost).toBe(5)
    })

    it("grows stats from nothing, for Ariel", async () => {
        const messages = await run({
            targets: [],
            growStats: true,
            availablePoints: 2,
        })

        expect(lastCandidate(messages)).toMatchObject({
            cost: 2,
            extended: true,
        })
        expect(messages.at(-1)?.result?.ok).toBe(true)
    })

    it("explains when no stat fits", async () => {
        const messages = await run({
            targets: [],
            growStats: true,
            availablePoints: 0,
        })

        expect(messages.at(-1)?.result?.reason).toContain("No stat node fits")
    })

    it("ends the route search on a stop, still spending leftovers", async () => {
        posted.length = 0
        window.dispatchEvent(
            new MessageEvent("message", {
                data: { ...baseMessage, stallMs: 600_000, spendLeftover: true },
            }),
        )
        await new Promise((resolve) => setTimeout(resolve, 50))
        window.dispatchEvent(
            new MessageEvent("message", { data: { type: "stop" } }),
        )
        await vi.waitFor(
            () => {
                expect(posted.at(-1)?.type).toBe("done")
            },
            { timeout: 2000 },
        )
        const candidate = lastCandidate(posted)

        expect(candidate?.extended).toBe(true)
        expect(candidate?.path).toContain("1,1")
    })
})
