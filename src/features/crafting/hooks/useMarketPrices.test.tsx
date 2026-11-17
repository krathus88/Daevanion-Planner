import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MarketPrices } from "./useMarketPrices"

const invoke = vi.fn()

vi.mock("@account/supabaseClient", () => {
    return { supabase: { functions: { invoke: invoke } } }
})

// The batcher keeps its queue in the module: load it fresh each test.
const load = async () => {
    vi.resetModules()

    return import("./useMarketPrices")
}

// A client of its own per test, nothing saved.
const makeWrapper = () => {
    const client = new QueryClient({
        defaultOptions: { queries: { gcTime: Infinity } },
    })

    return ({ children }: { children: ReactNode }) => {
        return (
            <QueryClientProvider client={client}>
                {children}
            </QueryClientProvider>
        )
    }
}

describe("useMarketPrices", () => {
    beforeEach(() => {
        invoke.mockReset()
    })

    it("counts items as loading from the first render", async () => {
        // Never answers: the items stay loading.
        invoke.mockReturnValue(new Promise(() => {}))

        const { useMarketPrices } = await load()
        const seen: MarketPrices[] = []

        renderHook(
            () => {
                const prices = useMarketPrices([1, 2])

                seen.push(prices)

                return prices
            },
            { wrapper: makeWrapper() },
        )

        // No price field flashes before the request.
        expect(seen[0].pending).toEqual({ 1: true, 2: true })
    })

    it("hands back the prices once answered, none for an unlisted item", async () => {
        invoke.mockResolvedValue({
            data: { prices: { 1: 7888, 2: null } },
            error: null,
        })

        const { useMarketPrices } = await load()
        const { result } = renderHook(
            () => {
                return useMarketPrices([1, 2])
            },
            { wrapper: makeWrapper() },
        )

        await waitFor(() => {
            expect(result.current).toEqual({ prices: { 1: 7888 }, pending: {} })
        })
        expect(invoke).toHaveBeenCalledTimes(1)
    })

    it("stops loading when the relay fails", async () => {
        invoke.mockResolvedValue({ data: null, error: new Error("down") })

        const { useMarketPrices } = await load()
        const { result } = renderHook(
            () => {
                return useMarketPrices([1])
            },
            { wrapper: makeWrapper() },
        )

        await waitFor(() => {
            expect(result.current).toEqual({ prices: {}, pending: {} })
        })
    })

    it("asks once for an item it already has", async () => {
        invoke.mockResolvedValue({ data: { prices: { 1: 5 } }, error: null })

        const { useMarketPrices } = await load()
        const wrapper = makeWrapper()
        const first = renderHook(
            () => {
                return useMarketPrices([1])
            },
            { wrapper: wrapper },
        )

        await waitFor(() => {
            expect(first.result.current.prices).toEqual({ 1: 5 })
        })

        const second = renderHook(
            () => {
                return useMarketPrices([1])
            },
            { wrapper: wrapper },
        )

        expect(second.result.current.prices).toEqual({ 1: 5 })
        expect(invoke).toHaveBeenCalledTimes(1)
    })
})
