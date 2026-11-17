import { beforeEach, describe, expect, it, vi } from "vitest"

const invoke = vi.fn()

vi.mock("@account/supabaseClient", () => {
    return { supabase: { functions: { invoke: invoke } } }
})

// The batcher keeps its queue in the module: load it fresh each test.
const load = async () => {
    vi.resetModules()

    return import("./marketPrices")
}

describe("market prices", () => {
    beforeEach(() => {
        invoke.mockReset()
    })

    it("reads the relay's prices, leaving out what it didn't look up", async () => {
        const { readRelayPrices } = await load()

        expect(
            readRelayPrices(
                { prices: { 1: 7888.4, 2: null, 4: 0 } },
                [1, 2, 3, 4],
            ),
        ).toEqual(
            new Map([
                [1, 7888],
                [2, null],
                [4, null],
            ]),
        )
        expect(readRelayPrices("nope", [1])).toEqual(new Map())
    })

    it("asks the relay once for the items asked together", async () => {
        invoke.mockResolvedValue({
            data: { prices: { 610610013: 7888, 610610014: null } },
            error: null,
        })

        const { loadMarketPrice } = await load()
        const prices = await Promise.all([
            loadMarketPrice(610610013),
            loadMarketPrice(610610014),
        ])

        expect(prices).toEqual([7888, null])
        expect(invoke).toHaveBeenCalledTimes(1)
        expect(invoke).toHaveBeenCalledWith("market-prices", {
            body: { ids: [610610013, 610610014] },
        })
    })

    it("asks for at most 100 items a request, one request at a time", async () => {
        // Answers every asked item.
        invoke.mockImplementation((_, options: { body: { ids: number[] } }) => {
            const prices: Record<string, number> = {}

            for (const id of options.body.ids) {
                prices[id] = 5
            }

            return Promise.resolve({ data: { prices: prices }, error: null })
        })

        const { loadMarketPrice } = await load()
        const ids = Array.from({ length: 150 }, (_, index) => index + 1)

        await Promise.all(ids.map(loadMarketPrice))

        expect(invoke).toHaveBeenCalledTimes(2)
        expect(invoke.mock.calls[0][1].body.ids).toHaveLength(100)
        expect(invoke.mock.calls[1][1].body.ids).toHaveLength(50)
    })

    it("fails the items when the relay fails", async () => {
        invoke.mockResolvedValue({ data: null, error: new Error("down") })

        const { loadMarketPrice } = await load()

        await expect(loadMarketPrice(610610013)).rejects.toThrow("down")
    })

    it("fails an item the relay left out, not caching it as unlisted", async () => {
        invoke.mockResolvedValue({ data: { prices: { 1: 5 } }, error: null })

        const { loadMarketPrice } = await load()
        const [listed, refused] = await Promise.allSettled([
            loadMarketPrice(1),
            loadMarketPrice(2),
        ])

        expect(listed).toEqual({ status: "fulfilled", value: 5 })
        expect(refused.status).toBe("rejected")
    })

    it("keeps an answer for 10 minutes, in the browser too", async () => {
        const { marketPriceQuery } = await load()

        expect(marketPriceQuery(1)).toMatchObject({
            queryKey: ["market-price", 1],
            staleTime: 10 * 60 * 1000,
            retry: false,
            meta: { persist: true },
        })
    })
})
