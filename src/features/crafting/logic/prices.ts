import type { SharedPrices } from "@crafting/shared/sharedPrices"
import type { LocalPrice } from "@crafting/types"

// Each item's price: the newer of this device's and the server's shared one.
// A local price cleared after the shared one was set hides it.
export const pickPrices = (
    local: Record<string, LocalPrice> | undefined,
    shared: SharedPrices,
) => {
    const picked: Record<string, number> = {}

    for (const [id, price] of Object.entries(shared)) {
        if (price) {
            picked[id] = price.value
        }
    }

    for (const [id, price] of Object.entries(local ?? {})) {
        const sharedPrice = shared[id]

        if (sharedPrice && sharedPrice.at > price.at) {
            continue
        }

        if (price.value === null) {
            delete picked[id]
        } else {
            picked[id] = price.value
        }
    }

    return picked
}
