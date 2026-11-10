import { beforeEach, describe, expect, it, vi } from "vitest"

const invoke = vi.fn()

vi.mock("@account/supabaseClient", () => {
    return { supabase: { functions: { invoke: invoke } } }
})

// The store keeps fetched prices for the session: load it fresh each test.
const load = async () => {
    vi.resetModules()

    return import("./marketPrices")
}

describe("market prices", () => {
    beforeEach(() => {
        invoke.mockReset()
    })

    it("reads the relay's prices, null for the rest", async () => {
        const { readRelayPrices } = await load()

        expect(
            readRelayPrices({ prices: { 1: 7888.4, 2: null } }, [1, 2, 3]),
        ).toEqual(
            new Map([
                [1, 7888],
                [2, null],
                [3, null],
            ]),
        )
        expect(readRelayPrices("nope", [1])).toEqual(new Map([[1, null]]))
    })

    it("asks the relay once for the items and publishes their prices", async () => {
        invoke.mockResolvedValue({
            data: { prices: { 610610013: 7888, 610610014: null } },
            error: null,
        })

        const {
            getMarketPrices,
            requestMarketPrices,
            subscribeToMarketPrices,
        } = await load()
        const changed = vi.fn()

        subscribeToMarketPrices(changed)
        requestMarketPrices([610610013, 610610014])
        requestMarketPrices([610610013])

        // Loading until the relay answers.
        expect(getMarketPrices().pending).toEqual({
            610610013: true,
            610610014: true,
        })

        await vi.waitFor(() => {
            expect(getMarketPrices()).toEqual({
                prices: { 610610013: 7888 },
                pending: {},
            })
        })
        expect(invoke).toHaveBeenCalledTimes(1)
        expect(invoke).toHaveBeenCalledWith("market-prices", {
            body: { ids: [610610013, 610610014] },
        })
        expect(changed).toHaveBeenCalled()

        // Fresh, even the one with no price: not asked again.
        requestMarketPrices([610610013, 610610014])
        expect(invoke).toHaveBeenCalledTimes(1)
    })

    it("leaves the items out when the relay fails", async () => {
        invoke.mockResolvedValue({ data: null, error: new Error("down") })

        const {
            getMarketPrices,
            requestMarketPrices,
            subscribeToMarketPrices,
        } = await load()
        const changed = vi.fn()

        subscribeToMarketPrices(changed)
        requestMarketPrices([610610013])

        await vi.waitFor(() => {
            expect(getMarketPrices().pending).toEqual({})
        })
        expect(getMarketPrices().prices).toEqual({})
    })
})
