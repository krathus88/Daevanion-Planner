import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "@account/supabaseClient"
import {
    isPageVisible,
    subscribeToPageVisibility,
} from "@common/pageVisibility"
import { isRecord } from "@planner/storage/isRecord"

// Which artifacts each faction held after a game server's last Artifact
// Siege, shared by every member: a database trigger copies them from the
// game snapshot of whoever's companion saw them first (or later, for a later
// siege), so nobody's site writes them.
type HoldRow = {
    server: number
    siege_end: string
    artifacts: unknown
}

export type SharedCorridorHold = {
    // The game's server number (gameIds getServerId).
    server: number
    // When the siege ended (ms).
    siegeEnd: number
    // Artifact id → faction holding it (0 none, 1 Elyos, 2 Asmodians).
    artifacts: Record<string, number>
}

const TABLE = "corridor_holds"
const COLUMNS = "server, siege_end, artifacts"
const EMPTY: readonly SharedCorridorHold[] = []

let holds: readonly SharedCorridorHold[] = EMPTY
// The open channel: only while the page is visible, so a hidden tab keeps
// no connection.
let channel: RealtimeChannel | null = null
let stopWatchingPage: (() => void) | null = null
const listeners = new Set<() => void>()

const emit = () => {
    for (const listener of listeners) {
        listener()
    }
}

// Null for a row this version of the site doesn't understand.
const toSharedHold = (row: HoldRow): SharedCorridorHold | null => {
    const siegeEnd = Date.parse(row.siege_end)

    if (
        !Number.isInteger(row.server) ||
        Number.isNaN(siegeEnd) ||
        !isRecord(row.artifacts)
    ) {
        return null
    }

    const artifacts: Record<string, number> = {}

    for (const [id, faction] of Object.entries(row.artifacts)) {
        if (typeof faction === "number") {
            artifacts[id] = faction
        }
    }

    return { server: row.server, siegeEnd: siegeEnd, artifacts: artifacts }
}

const putRow = (row: HoldRow) => {
    const hold = toSharedHold(row)

    if (hold === null) {
        return
    }

    holds = [...holds.filter((item) => item.server !== hold.server), hold]
    emit()
}

// Every server's: a row per server, so there are at most 46.
const load = async () => {
    const { data, error } = await supabase.from(TABLE).select(COLUMNS)

    if (error || channel === null) {
        return
    }

    holds = data.flatMap((row: HoldRow) => {
        return toSharedHold(row) ?? []
    })
    emit()
}

const stop = () => {
    if (channel) {
        void supabase.removeChannel(channel)
        channel = null
    }
}

// Opens the channel while the page is visible and anything watches, and
// closes it otherwise. Holdings stay while hidden; reconnecting reloads them.
const update = () => {
    const wanted = isPageVisible() && listeners.size > 0

    if (wanted === (channel !== null)) {
        return
    }

    stop()

    if (!wanted) {
        return
    }

    // Rows are only ever written by the trigger, never deleted.
    channel = supabase
        .channel(TABLE)
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: TABLE },
            (payload) => {
                if (payload.eventType !== "DELETE") {
                    putRow(payload.new as HoldRow)
                }
            },
        )
        .subscribe((status) => {
            // Also on reconnects, to catch up on anything missed.
            if (status === "SUBSCRIBED") {
                void load()
            }
        })
}

export const readSharedCorridorHolds = () => {
    return holds
}

export const subscribeToSharedCorridorHolds = (onChange: () => void) => {
    listeners.add(onChange)
    stopWatchingPage ??= subscribeToPageVisibility(update)
    update()

    return () => {
        listeners.delete(onChange)

        if (listeners.size === 0) {
            stopWatchingPage?.()
            stopWatchingPage = null
            update()
            holds = EMPTY
        }
    }
}
