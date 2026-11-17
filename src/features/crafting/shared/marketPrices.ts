import { supabase } from "@account/supabaseClient"
import { PERSIST_MAX_AGE_MS } from "@layout/queryCache"

// Market prices from Aion2Market (aion2.exchange). Its API doesn't let other
// sites read it (no CORS), so a Supabase Edge Function, `market-prices`,
// fetches them server-side (the user's dashboard; code in memory, not the
// repo). Cached by TanStack Query, in the browser too, for 10 minutes (the
// market updates only so often); never saved to the shared prices table.

const FUNCTION_NAME = "market-prices"

// Items per request to the relay.
const BATCH = 100

type Waiting = {
    id: number
    resolve: (price: number | null) => void
    reject: (error: unknown) => void
}

const queue: Waiting[] = []
let busy = false

const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null
}

// The relay's answer, `{ prices: { "<id>": number | null } }`: each asked
// item's price, null when it isn't on the market; an item it left out
// couldn't be looked up (Aion2Market refused or failed) and isn't in the map.
export const readRelayPrices = (json: unknown, ids: number[]) => {
    const prices = isObject(json) && isObject(json.prices) ? json.prices : {}
    const result = new Map<number, number | null>()

    for (const id of ids) {
        if (!(id in prices)) {
            continue
        }

        const price = prices[id]

        result.set(
            id,
            typeof price === "number" && price > 0 ? Math.round(price) : null,
        )
    }

    return result
}

// One request at a time, up to BATCH items each; a failed request, or an
// item the relay left out, fails its query: not saved, asked again when next
// needed.
const pump = async () => {
    if (busy || queue.length === 0) {
        return
    }

    const batch = queue.splice(0, BATCH)
    const ids = batch.map((waiting) => waiting.id)

    busy = true

    try {
        const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
            body: { ids: ids },
        })

        if (error) {
            throw error
        }

        const prices = readRelayPrices(data, ids)

        for (const waiting of batch) {
            const price = prices.get(waiting.id)

            // Left out: not looked up, so not cached as "no price".
            if (price === undefined) {
                waiting.reject(new Error("Not looked up"))
            } else {
                waiting.resolve(price)
            }
        }
    } catch (error) {
        for (const waiting of batch) {
            waiting.reject(error)
        }
    }

    busy = false
    void pump()
}

// One item's price, asked for with the others asked in the same moment:
// Kinah, the lowest listing, or null when it's not on the market.
export const loadMarketPrice = (id: number) => {
    return new Promise<number | null>((resolve, reject) => {
        queue.push({ id: id, resolve: resolve, reject: reject })
        // After this render's other queries have queued theirs.
        queueMicrotask(() => {
            void pump()
        })
    })
}

// An item's market price as a query: fresh for 10 minutes, kept in the
// browser for that long, not retried (a field is better than a long wait).
export const marketPriceQuery = (id: number) => {
    return {
        queryKey: ["market-price", id],
        queryFn: () => {
            return loadMarketPrice(id)
        },
        staleTime: PERSIST_MAX_AGE_MS,
        retry: false,
        meta: { persist: true },
    }
}
