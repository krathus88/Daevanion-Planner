import {
    getMarketPrices,
    requestMarketPrices,
    subscribeToMarketPrices,
} from "@crafting/shared/marketPrices"
import { useEffect, useSyncExternalStore } from "react"

// Market prices for these items (fetched as needed), with every other known
// one.
export const useMarketPrices = (ids: number[]) => {
    const prices = useSyncExternalStore(
        subscribeToMarketPrices,
        getMarketPrices,
    )
    const key = ids.join(",")

    useEffect(() => {
        requestMarketPrices(key === "" ? [] : key.split(",").map(Number))
    }, [key])

    return prices
}
