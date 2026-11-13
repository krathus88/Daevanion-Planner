// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// The feed needs only sharedReports' key helper; a real client per
// resetModules makes Supabase warn about several auth clients.
vi.mock("@account/supabaseClient", () => {
    return { supabase: {} }
})

const GARTUA = 2101074
const DANAR = 2400017
const ARGO_SPIRIT_KING = 2600068

type Entry = {
    bossCode: number
    targetAt: number
    observedAtMs: number
    spawned?: boolean
}

const entry = (bossCode: number, targetAt = 5_000): Entry => {
    return { bossCode: bossCode, targetAt: targetAt, observedAtMs: 1_000 }
}

const makeFeed = (servers: { serverId: number; entries: Entry[] }[]) => {
    return {
        schema: "notmeter-global-field-boss-public-cache-v1",
        version: 1,
        serviceRegion: "WW",
        globalRegion: "eu",
        generatedAt: 1,
        servers: servers.map((server) => {
            return {
                serverId: server.serverId,
                maps: [{ mapId: 1010, observedAt: 1, entries: server.entries }],
            }
        }),
    }
}

const FEED = makeFeed([{ serverId: 1301, entries: [entry(GARTUA)] }])

const load = async () => {
    vi.resetModules()

    return import("./notmeterFeed")
}

describe("parseNotmeterFeed", () => {
    it("turns entries into spawn reports by server and boss", async () => {
        const { parseNotmeterFeed } = await load()
        const result = parseNotmeterFeed(FEED)

        expect(result.ok && result.reports["siel/gartua"]?.report).toEqual({
            spawnAt: 5_000,
            reportedAt: 1_000,
        })
    })

    // Re-read every few minutes, it must not beat a manual report it has
    // no newer kill for.
    it("dates each time by the kill it counts from, not the read", async () => {
        const { parseNotmeterFeed } = await load()
        const HOUR = 3_600_000
        const result = parseNotmeterFeed(
            makeFeed([
                {
                    serverId: 1301,
                    entries: [
                        {
                            // Eternal Gartua, 11 h respawn
                            bossCode: GARTUA,
                            targetAt: 20 * HOUR,
                            observedAtMs: 15 * HOUR,
                        },
                    ],
                },
            ]),
        )

        expect(result.ok && result.reports["siel/gartua"]?.reportedAt).toBe(
            9 * HOUR,
        )
    })

    it("maps NotMeter's server numbers onto our pairs", async () => {
        const { parseNotmeterFeed } = await load()
        const result = parseNotmeterFeed(
            makeFeed([
                { serverId: 2301, entries: [entry(DANAR)] },
                { serverId: 1323, entries: [entry(GARTUA)] },
                { serverId: 2323, entries: [entry(DANAR)] },
            ]),
        )

        expect(result.ok && Object.keys(result.reports)).toEqual([
            "israphel/danar",
            "nathara/gartua",
            "tassin/danar",
        ])
    })

    it("skips spawned bosses, unknown bosses and unknown servers", async () => {
        const { parseNotmeterFeed } = await load()
        const result = parseNotmeterFeed(
            makeFeed([
                {
                    serverId: 1301,
                    entries: [
                        { ...entry(GARTUA), spawned: true },
                        entry(ARGO_SPIRIT_KING),
                        entry(DANAR),
                    ],
                },
                { serverId: 9999, entries: [entry(GARTUA)] },
            ]),
        )

        expect(result.ok && Object.keys(result.reports)).toEqual(["siel/danar"])
    })

    it("accepts a feed whose only known bosses are up", async () => {
        const { parseNotmeterFeed } = await load()
        const result = parseNotmeterFeed(
            makeFeed([
                {
                    serverId: 1301,
                    entries: [{ ...entry(GARTUA), spawned: true }],
                },
            ]),
        )

        expect(result).toEqual({ ok: true, reports: {} })
    })
})

// A changed format must show up as an error, never as an empty feed.
describe("parseNotmeterFeed on a changed format", () => {
    it.each([
        ["not an object", "not a JSON object", []],
        ["a new schema", "unknown format", { ...FEED, schema: "v2" }],
        ["a new version", "unknown format", { ...FEED, version: 2 }],
        ["another region", "not the EU feed", { ...FEED, globalRegion: "as" }],
        ["no server list", "no server list", { ...FEED, servers: {} }],
        [
            "servers without maps",
            "no map list",
            { ...FEED, servers: [{ serverId: 1301, regions: [] }] },
        ],
        [
            "maps without entries",
            "no boss list",
            { ...FEED, servers: [{ serverId: 1301, maps: [{ bosses: [] }] }] },
        ],
        [
            "renamed entry fields",
            "malformed",
            makeFeed([
                {
                    serverId: 1301,
                    entries: [{ code: GARTUA, spawnAt: 5 } as never],
                },
            ]),
        ],
        [
            "renumbered bosses",
            "match ours",
            makeFeed([{ serverId: 1301, entries: [entry(123)] }]),
        ],
        [
            "renumbered servers",
            "match ours",
            makeFeed([{ serverId: 1, entries: [entry(GARTUA)] }]),
        ],
    ])("fails on %s", async (_name, message, feed) => {
        const { parseNotmeterFeed } = await load()
        expect(parseNotmeterFeed(feed)).toEqual({
            ok: false,
            error: expect.stringContaining(message),
        })
    })
})

describe("the feed store", () => {
    const respond = (body: unknown, status = 200) => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                return new Response(JSON.stringify(body), { status: status })
            }),
        )
    }

    const watch = async (module: Awaited<ReturnType<typeof load>>) => {
        const onChange = vi.fn()
        const unsubscribe = module.subscribeToNotmeterFeed(onChange)

        await vi.waitFor(() => {
            expect(onChange).toHaveBeenCalled()
        })

        return { onChange: onChange, unsubscribe: unsubscribe }
    }

    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it("loads the reports", async () => {
        respond(FEED)

        const module = await load()

        await watch(module)

        expect(module.readNotmeterFeed().error).toBeNull()
        expect(Object.keys(module.readNotmeterFeed().reports)).toEqual([
            "siel/gartua",
        ])
    })

    it("reports a changed format loudly", async () => {
        respond({ ...FEED, schema: "v2" })

        const module = await load()

        await watch(module)

        expect(module.readNotmeterFeed().error).toContain("unknown format")
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining("NotMeter feed: unknown format"),
        )
    })

    it("reports a failed download", async () => {
        respond({}, 404)

        const module = await load()

        await watch(module)

        expect(module.readNotmeterFeed().error).toBe("HTTP 404")
    })

    it("keeps the last good reports when a read fails", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
        respond(FEED)

        const module = await load()
        const { onChange } = await watch(module)

        respond({ ...FEED, schema: "v2" })
        onChange.mockClear()
        vi.advanceTimersByTime(2 * 60_000)
        await vi.waitFor(() => {
            expect(onChange).toHaveBeenCalled()
        })

        expect(module.readNotmeterFeed().error).toContain("unknown format")
        expect(module.readNotmeterFeed().reports["siel/gartua"]).toBeDefined()
        vi.useRealTimers()
    })

    it("forgets everything once nobody watches", async () => {
        respond(FEED)

        const module = await load()
        const { unsubscribe } = await watch(module)

        unsubscribe()

        expect(module.readNotmeterFeed()).toEqual({ reports: {}, error: null })
    })
})
