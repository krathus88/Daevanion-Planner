import { supabase } from "@account/supabaseClient"

// Market prices from Aion2Market (aion2.exchange). Its API doesn't let other
// sites read it (no CORS), so a Supabase Edge Function, `market-prices`,
// fetches them server-side (the user's dashboard; code in memory, not the
// repo). Kept in memory only: never saved to the shared prices table.

const FUNCTION_NAME = "market-prices"

// How long a fetched price is used before it's asked for again.
const MAX_AGE_MS = 30 * 60 * 1000
// Items per request to the relay.
const BATCH = 100

type Entry = {
    // Kinah, the lowest listing; null when not on the market or unreadable.
    price: number | null
    at: number
}

const entries = new Map<number, Entry>()
const queue: number[] = []
const queued = new Set<number>()
const listeners = new Set<() => void>()
let busy = false
// What the page reads: known prices, and the items still being fetched.
export type MarketPrices = {
    prices: Record<string, number>
    pending: Record<string, true>
}

let snapshot: MarketPrices = { prices: {}, pending: {} }

const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null
}

// The relay's answer, `{ prices: { "<id>": number | null } }`: each asked
// item's price, null when it has none.
export const readRelayPrices = (json: unknown, ids: number[]) => {
    const prices = isObject(json) && isObject(json.prices) ? json.prices : {}
    const result = new Map<number, number | null>()

    for (const id of ids) {
        const price = prices[id]

        result.set(
            id,
            typeof price === "number" && price > 0 ? Math.round(price) : null,
        )
    }

    return result
}

const publish = () => {
    const prices: Record<string, number> = {}
    const pending: Record<string, true> = {}

    for (const [id, entry] of entries) {
        if (entry.price !== null) {
            prices[id] = entry.price
        }
    }

    for (const id of queued) {
        pending[id] = true
    }

    snapshot = { prices: prices, pending: pending }

    for (const listener of listeners) {
        listener()
    }
}

const fetchPrices = async (ids: number[]) => {
    try {
        const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
            body: { ids: ids },
        })

        return readRelayPrices(error ? null : data, ids)
    } catch {
        return readRelayPrices(null, ids)
    }
}

// One request at a time, up to BATCH items each.
const pump = () => {
    if (busy || queue.length === 0) {
        return
    }

    const ids = queue.splice(0, BATCH)

    busy = true

    void fetchPrices(ids).then((prices) => {
        const at = Date.now()

        for (const [id, price] of prices) {
            queued.delete(id)
            entries.set(id, { price: price, at: at })
        }

        busy = false
        publish()
        pump()
    })
}

// Asks for the prices of these items, skipping fresh and pending ones.
export const requestMarketPrices = (ids: number[]) => {
    const now = Date.now()
    let added = false

    for (const id of ids) {
        const entry = entries.get(id)

        if (queued.has(id) || (entry && now - entry.at < MAX_AGE_MS)) {
            continue
        }

        queued.add(id)
        queue.push(id)
        added = true
    }

    if (added) {
        publish()
    }

    pump()
}

export const subscribeToMarketPrices = (listener: () => void) => {
    listeners.add(listener)

    return () => {
        listeners.delete(listener)
    }
}

// Every known market price by item id, and the ones loading; a new object on
// each change.
export const getMarketPrices = () => {
    return snapshot
}
