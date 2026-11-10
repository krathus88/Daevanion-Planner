import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "@account/supabaseClient"

type PriceRow = {
    server: string
    item_id: number
    price: number
    updated_at: string
}

// A server's price for an item, and when it was set (ms).
export type SharedPrice = {
    value: number
    at: number
}

// By item id, for the server watched.
export type SharedPrices = Partial<Record<string, SharedPrice>>

const TABLE = "crafting_prices"
const COLUMNS = "server, item_id, price, updated_at"
const EMPTY: SharedPrices = {}

let prices: SharedPrices = EMPTY
let watching: { server: string; channel: RealtimeChannel } | null = null
const listeners = new Set<() => void>()

const emit = () => {
    for (const listener of listeners) {
        listener()
    }
}

const toSharedPrice = (row: PriceRow): SharedPrice => {
    return { value: Number(row.price), at: Date.parse(row.updated_at) }
}

const putRow = (row: PriceRow) => {
    prices = { ...prices, [row.item_id]: toSharedPrice(row) }
    emit()
}

const removeRow = (itemId: number) => {
    const next = { ...prices }

    delete next[itemId]
    prices = next
    emit()
}

const isWatched = (server: unknown) => {
    return watching !== null && watching.server === server
}

const load = async (server: string) => {
    const { data, error } = await supabase
        .from(TABLE)
        .select(COLUMNS)
        .eq("server", server)

    if (error || !isWatched(server)) {
        return
    }

    const loaded: SharedPrices = {}

    for (const row of data) {
        loaded[row.item_id] = toSharedPrice(row)
    }

    prices = loaded
    emit()
}

const stop = () => {
    if (watching) {
        void supabase.removeChannel(watching.channel)
        watching = null
    }
}

const watch = (server: string) => {
    if (isWatched(server)) {
        return
    }

    stop()
    prices = EMPTY

    // Unfiltered: Supabase can't filter deletes (they carry only the key,
    // server and item), and prices change rarely.
    const channel = supabase
        .channel(`${TABLE}:${server}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: TABLE,
            },
            (payload) => {
                if (payload.eventType === "DELETE") {
                    if (isWatched(payload.old.server)) {
                        removeRow(payload.old.item_id)
                    }
                } else if (isWatched(payload.new.server)) {
                    putRow(payload.new as PriceRow)
                }
            },
        )
        .subscribe((status) => {
            // Also on reconnects, to catch up on anything missed.
            if (status === "SUBSCRIBED") {
                void load(server)
            }
        })

    watching = { server: server, channel: channel }
}

export const readSharedPrices = () => {
    return prices
}

export const subscribeToSharedPrices = (
    server: string,
    onChange: () => void,
) => {
    watch(server)
    listeners.add(onChange)

    return () => {
        listeners.delete(onChange)

        if (listeners.size === 0) {
            stop()
            prices = EMPTY
        }
    }
}

// Shares a price with everyone on the server; null removes it. Resolves
// false when the database refuses it, e.g. when not logged in.
export const writeSharedPrice = async (
    server: string,
    itemId: number,
    price: number | null,
) => {
    if (price === null) {
        const { error } = await supabase
            .from(TABLE)
            .delete()
            .eq("server", server)
            .eq("item_id", itemId)

        if (!error && isWatched(server)) {
            removeRow(itemId)
        }

        return !error
    }

    const { data, error } = await supabase
        .from(TABLE)
        .upsert({ server: server, item_id: itemId, price: price })
        .select(COLUMNS)
        .single()

    if (!error && isWatched(server)) {
        putRow(data)
    }

    return !error
}
