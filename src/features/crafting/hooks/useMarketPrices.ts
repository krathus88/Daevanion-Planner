import { marketPriceQuery } from "@crafting/shared/marketPrices"
import { useQueries, type UseQueryResult } from "@tanstack/react-query"

// What the page reads: known prices, and the items still loading.
export type MarketPrices = {
    prices: Record<string, number>
    pending: Record<string, true>
}

// Prices by item id from the queries, in the order asked; an item without
// an answer yet is pending (from its first render, so no price field
// flashes), one whose request failed is neither.
const combinePrices = (
    ids: number[],
    results: UseQueryResult<number | null>[],
): MarketPrices => {
    const prices: Record<string, number> = {}
    const pending: Record<string, true> = {}

    for (const [index, result] of results.entries()) {
        const id = ids[index]

        if (typeof result.data === "number") {
            prices[id] = result.data
        }

        // No answer and no error yet, fetching or about to.
        if (result.isPending) {
            pending[id] = true
        }
    }

    return { prices: prices, pending: pending }
}

// Market prices for these items, asked for as needed and cached.
export const useMarketPrices = (ids: number[]) => {
    const combine = (results: UseQueryResult<number | null>[]) => {
        return combinePrices(ids, results)
    }

    return useQueries({
        queries: ids.map(marketPriceQuery),
        combine: combine,
    })
}
