import { isRecord } from "@planner/storage/isRecord"
import { toAccountValue } from "./deviceFields"
import { jsonEquals } from "./jsonEquals"
import { isSyncedKey } from "./syncedKeys"

// When each synced key was last edited, which edits the account doesn't have
// yet, and which account version each key last matched. Kept while signed
// out too, so those edits upload on login.
export type SyncMeta = {
    times: Record<string, number>
    pending: string[]
    synced: Record<string, number>
}

const META_KEY = "daevanion:sync:v1:state"

const listeners = new Set<() => void>()

export const readSyncMeta = (): SyncMeta => {
    try {
        const raw = window.localStorage.getItem(META_KEY)
        const value: unknown = raw === null ? null : JSON.parse(raw)

        if (
            isRecord(value) &&
            isRecord(value.times) &&
            Array.isArray(value.pending)
        ) {
            return {
                times: value.times as Record<string, number>,
                pending: value.pending as string[],
                synced: isRecord(value.synced)
                    ? (value.synced as Record<string, number>)
                    : {},
            }
        }
    } catch {
        // Unreadable: start over; the next login compares with the account.
    }

    return { times: {}, pending: [], synced: {} }
}

export const writeSyncMeta = (meta: SyncMeta) => {
    try {
        window.localStorage.setItem(META_KEY, JSON.stringify(meta))
    } catch {
        // Storage is full or blocked: the edit still uploads this session.
    }
}

// Not edited here since it last matched the account (or never stored here).
export const isUnsynced = (meta: SyncMeta, key: string) => {
    return meta.pending.includes(key) || meta.synced[key] === undefined
}

export const markSynced = (meta: SyncMeta, key: string, time: number) => {
    meta.times[key] = time
    meta.synced[key] = time
    meta.pending = meta.pending.filter((pending) => pending !== key)
}

export const markEdited = (meta: SyncMeta, key: string, time: number) => {
    meta.times[key] = time

    if (!meta.pending.includes(key)) {
        meta.pending.push(key)
    }
}

// E.g. dragging the Coming next strip: nothing the account keeps changed.
const onlyDeviceFieldsChanged = (
    key: string,
    previous: string | null,
    raw: string,
) => {
    if (previous === null) {
        return false
    }

    try {
        return jsonEquals(
            toAccountValue(key, JSON.parse(previous)),
            toAccountValue(key, JSON.parse(raw)),
        )
    } catch {
        return false
    }
}

export const subscribeToLocalChanges = (onChange: () => void) => {
    listeners.add(onChange)

    return () => {
        listeners.delete(onChange)
    }
}

// Every synced save goes through here instead of localStorage.setItem.
export const setStoredItem = (key: string, raw: string) => {
    // Saving the same thing again (e.g. a click that moved nothing) isn't an
    // edit, so it can't make this copy look newer than the account's.
    const previous = window.localStorage.getItem(key)

    if (previous === raw) {
        return
    }

    window.localStorage.setItem(key, raw)

    if (!isSyncedKey(key) || onlyDeviceFieldsChanged(key, previous, raw)) {
        return
    }

    const meta = readSyncMeta()

    markEdited(meta, key, Date.now())
    writeSyncMeta(meta)

    for (const listener of listeners) {
        listener()
    }
}
