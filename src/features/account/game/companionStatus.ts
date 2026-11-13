import { readAuth, subscribeToAuth } from "@account/auth"
import { supabase } from "@account/supabaseClient"
import {
    subscribeToAccountRows,
    type AccountRowChange,
} from "@account/sync/accountChanges"
import {
    isPageVisible,
    subscribeToPageVisibility,
} from "@common/pageVisibility"
import { isRecord } from "@planner/storage/isRecord"
import type { GameCharacter } from "./gameSnapshot"

// The companion app keeps this row fresh while it runs (every minute, and on
// each character change) and marks it stopped when closed.
const COMPANION_STATUS_KEY = "daevanion:companion:v1:status"

// How old a "running" row may be before it counts as stopped (a crash or a
// lost connection never says so).
const STALE_MS = 3 * 60_000

export type CompanionStatus =
    // Logged out, or not asked yet.
    | { state: "unknown" }
    | { state: "stopped" }
    | { state: "running"; character: GameCharacter | null }

const isCharacter = (value: unknown): value is GameCharacter => {
    return (
        isRecord(value) &&
        typeof value.name === "string" &&
        typeof value.server === "number" &&
        typeof value.class === "number"
    )
}

// What a status row means at `now`.
export const readCompanionStatus = (
    value: unknown,
    now: number,
): CompanionStatus => {
    if (
        !isRecord(value) ||
        value.v !== 1 ||
        value.running !== true ||
        typeof value.at !== "number" ||
        now - value.at > STALE_MS
    ) {
        return { state: "stopped" }
    }

    return {
        state: "running",
        character: isCharacter(value.character) ? value.character : null,
    }
}

const UNKNOWN: CompanionStatus = { state: "unknown" }

let status: CompanionStatus = UNKNOWN
// The status row as last read: null when there is none, undefined before
// the first read.
let row: unknown = undefined
let staleTimer: number | undefined
// Whose row it is.
let watchedUser: string | null = null
let unwatch: (() => void) | null = null
const listeners = new Set<() => void>()

const setStatus = (next: CompanionStatus) => {
    // Keep the same object while nothing changed, for useSyncExternalStore.
    if (JSON.stringify(next) === JSON.stringify(status)) {
        return
    }

    status = next

    for (const listener of listeners) {
        listener()
    }
}

// What the row means now. A running row stops being refreshed when the app
// crashes or loses its connection: look again once it would be stale.
const show = () => {
    window.clearTimeout(staleTimer)

    // Hidden, the channel is closed and the row goes unrefreshed: keep the
    // status as it was until the reconnect reads the row again.
    if (!isPageVisible()) {
        return
    }

    if (readAuth().status !== "signedIn" || row === undefined) {
        setStatus(UNKNOWN)

        return
    }

    const now = Date.now()

    setStatus(readCompanionStatus(row, now))

    if (isRecord(row) && row.running === true && typeof row.at === "number") {
        const wait = row.at + STALE_MS - now

        if (wait > 0) {
            staleTimer = window.setTimeout(show, wait + 1000)
        }
    }
}

// Once per (re)connect: Realtime only tells changes from then on.
const fetchStatus = async () => {
    const { data, error } = await supabase
        .from("user_data")
        .select("value")
        .eq("key", COMPANION_STATUS_KEY)
        .maybeSingle()

    if (error) {
        // Keep what we knew: a failed read says nothing about the app.
        return
    }

    row = data?.value ?? null
    show()
}

const handleAccountChange = (change: AccountRowChange) => {
    if (change.key === COMPANION_STATUS_KEY) {
        row = change.value ?? null
        show()
    }
}

// Auth also reports token refreshes and session checks for the same user:
// only another user (or none) makes the row unknown. The channel then
// reconnects for them, which reads it again.
const handleAuthChange = () => {
    const auth = readAuth()
    const user = auth.status === "signedIn" ? auth.userId : null

    if (user !== watchedUser) {
        watchedUser = user
        row = undefined
    }

    show()
}

// Shown again while signed in, the channel reconnects and reads the row.
// Signed out meanwhile, nothing reconnects: show that now.
const handleShown = () => {
    if (isPageVisible() && readAuth().status !== "signedIn") {
        show()
    }
}

export const readCompanionStatusNow = () => {
    return status
}

// No polling: the companion's minute updates arrive over Supabase Realtime
// while a page shows the status, the tab is visible and the user is logged
// in.
export const subscribeToCompanionStatus = (onChange: () => void) => {
    listeners.add(onChange)

    if (unwatch === null) {
        const auth = readAuth()

        watchedUser = auth.status === "signedIn" ? auth.userId : null

        const stopRows = subscribeToAccountRows(handleAccountChange, () => {
            void fetchStatus()
        })
        const stopAuth = subscribeToAuth(handleAuthChange)
        const stopPage = subscribeToPageVisibility(handleShown)

        unwatch = () => {
            stopRows()
            stopAuth()
            stopPage()
            window.clearTimeout(staleTimer)
            row = undefined
            watchedUser = null
        }
    }

    return () => {
        listeners.delete(onChange)

        if (listeners.size === 0 && unwatch !== null) {
            unwatch()
            unwatch = null
        }
    }
}
