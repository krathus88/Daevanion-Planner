import { readAuth, subscribeToAuth } from "@account/auth"
import { supabase } from "@account/supabaseClient"
import type { RealtimeChannel } from "@supabase/supabase-js"

// A change to one of the user's user_data rows, as Supabase Realtime tells
// it: the new value, or undefined once deleted.
export type AccountRowChange = {
    key: string
    value: unknown
}

type Watcher = {
    onChange: (change: AccountRowChange) => void
    // On every (re)connect: changes made while away were never sent.
    onConnect?: () => void
}

const TABLE = "user_data"

let channel: RealtimeChannel | null = null
let watchedUser: string | null = null
let connected = false
// Each channel gets its own topic: Supabase hands back a channel of the same
// topic that is still closing, which never connects again.
let channelCount = 0
let started = false
const watchers = new Set<Watcher>()

const readKey = (row: Record<string, unknown>) => {
    return typeof row.key === "string" ? row.key : null
}

// One channel per signed-in user, open while anyone watches: each change is
// one Realtime message, however many parts of the page listen.
const update = () => {
    const auth = readAuth()
    const user =
        auth.status === "signedIn" && watchers.size > 0 ? auth.userId : null

    if (user === watchedUser) {
        return
    }

    if (channel !== null) {
        void supabase.removeChannel(channel)
        channel = null
    }

    watchedUser = user
    connected = false

    if (user === null) {
        return
    }

    channel = supabase
        .channel(`${TABLE}:${user}:${++channelCount}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: TABLE,
                filter: `user_id=eq.${user}`,
            },
            (payload) => {
                const deleted = payload.eventType === "DELETE"
                const key = readKey(deleted ? payload.old : payload.new)

                if (key === null) {
                    return
                }

                const change = {
                    key: key,
                    value: deleted ? undefined : payload.new.value,
                }

                for (const watcher of watchers) {
                    watcher.onChange(change)
                }
            },
        )
        .subscribe((state) => {
            connected = state === "SUBSCRIBED"

            if (connected) {
                for (const watcher of watchers) {
                    watcher.onConnect?.()
                }
            }
        })
}

// Needs user_data in the supabase_realtime publication (applied).
export const subscribeToAccountRows = (
    onChange: (change: AccountRowChange) => void,
    onConnect?: () => void,
) => {
    if (!started) {
        started = true
        subscribeToAuth(update)
    }

    const watcher = { onChange: onChange, onConnect: onConnect }

    watchers.add(watcher)
    update()

    // Joining a channel already open: catch up now.
    if (connected) {
        onConnect?.()
    }

    return () => {
        watchers.delete(watcher)
        update()
    }
}
