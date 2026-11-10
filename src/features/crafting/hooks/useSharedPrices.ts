import {
    readSharedPrices,
    subscribeToSharedPrices,
} from "@crafting/shared/sharedPrices"
import { useSyncExternalStore } from "react"

// The server's shared prices, kept up to date while the page is open.
export const useSharedPrices = (server: string) => {
    const subscribe = (onChange: () => void) => {
        return subscribeToSharedPrices(server, onChange)
    }

    return useSyncExternalStore(subscribe, readSharedPrices)
}
