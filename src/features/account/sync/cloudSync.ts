import { readAuth, subscribeToAuth } from "@account/auth"
import { supabase } from "@account/supabaseClient"
import { isRecord } from "@planner/storage/isRecord"
import { bumpStorageRevision } from "@planner/storage/storageRevision"
import { toAccountValue, withDeviceFields } from "./deviceFields"
import { jsonEquals } from "./jsonEquals"
import { mergeSyncedValue } from "./mergeSyncedValue"
import { isPlannerKey, isSyncedKey } from "./syncedKeys"
import {
    isUnsynced,
    markEdited,
    markSynced,
    readSyncMeta,
    subscribeToLocalChanges,
    writeSyncMeta,
} from "./syncMeta"

// The same key, changed both here and in the account since they last matched.
export type SyncConflict = {
    key: string
    device: unknown
    // Missing for data saved before sync existed.
    deviceTime: number | undefined
    account: unknown
    accountTime: number
}

export type SyncChoice = "device" | "account" | "merge"

export type SyncStatus =
    | { state: "off" }
    | { state: "syncing" }
    | { state: "synced" }
    | { state: "error"; message: string }
    // Nothing syncs until the user picks what to keep.
    | { state: "conflict"; conflicts: SyncConflict[]; open: boolean }

type RemoteRow = {
    key: string
    updated_at: string
}

type RemoteValue = RemoteRow & {
    value: unknown
}

type UploadRow = RemoteValue & {
    user_id: string
}

const TABLE = "user_data"
// Waits for a pause in editing, so a burst of clicks is one upload.
const PUSH_DELAY = 2000
const CHUNK_SIZE = 50

let status: SyncStatus = { state: "off" }
let userId: string | null = null
let started = false
let running = false
let queued = false
let needsPull = false
let pushTimer: number | undefined
// Downloads that wait with the conflicts, so a choice applies them together.
let heldDownloads: RemoteValue[] = []
const listeners = new Set<() => void>()

const setStatus = (next: SyncStatus) => {
    status = next

    for (const listener of listeners) {
        listener()
    }
}

const toChunks = <T>(items: T[]) => {
    const chunks: T[][] = []

    for (let start = 0; start < items.length; start += CHUNK_SIZE) {
        chunks.push(items.slice(start, start + CHUNK_SIZE))
    }

    return chunks
}

const parseStored = (raw: string) => {
    try {
        return { value: JSON.parse(raw) as unknown }
    } catch {
        return null
    }
}

const listLocalKeys = () => {
    const keys: string[] = []

    for (let index = 0; index < window.localStorage.length; index++) {
        const key = window.localStorage.key(index)

        if (key !== null && isSyncedKey(key)) {
            keys.push(key)
        }
    }

    return keys
}

const readLocal = (key: string) => {
    const stored = window.localStorage.getItem(key)

    return stored === null ? null : parseStored(stored)
}

// Saves an account value here, keeping this device's own fields, without
// counting it as an edit, and tells the open pages to reread it.
const storeLocally = (key: string, value: unknown) => {
    const local = readLocal(key)?.value
    const merged = withDeviceFields(key, value, local)

    window.localStorage.setItem(key, JSON.stringify(merged))
    window.dispatchEvent(new StorageEvent("storage", { key: key }))
}

// Compares only what the account keeps.
const sameInAccount = (key: string, a: unknown, b: unknown) => {
    return jsonEquals(toAccountValue(key, a), toAccountValue(key, b))
}

// Writes the account's copies here.
const applyRemote = (rows: RemoteValue[]) => {
    const meta = readSyncMeta()
    let plannerChanged = false

    for (const row of rows) {
        const remoteTime = Date.parse(row.updated_at)

        // Edited here while the download ran: this copy is newer.
        if (
            meta.pending.includes(row.key) &&
            (meta.times[row.key] ?? 0) > remoteTime
        ) {
            continue
        }

        markSynced(meta, row.key, remoteTime)

        const local = readLocal(row.key)

        if (local !== null && sameInAccount(row.key, local.value, row.value)) {
            continue
        }

        storeLocally(row.key, row.value)
        plannerChanged ||= isPlannerKey(row.key)
    }

    writeSyncMeta(meta)

    if (plannerChanged) {
        bumpStorageRevision()
    }
}

// Lists the account's keys first, then downloads only the ones that changed.
// A key changed on both sides is a conflict; returns false when there are
// some, leaving everything as it is until the user chooses.
const pull = async () => {
    const { data, error } = await supabase.from(TABLE).select("key, updated_at")

    if (error) {
        throw error
    }

    const remoteTimes = new Map<string, number>()
    const changed: string[] = []
    const lastMeta = readSyncMeta()

    for (const row of data as RemoteRow[]) {
        const remoteTime = Date.parse(row.updated_at)

        remoteTimes.set(row.key, remoteTime)

        if (
            remoteTime !== lastMeta.synced[row.key] ||
            window.localStorage.getItem(row.key) === null
        ) {
            changed.push(row.key)
        }
    }

    const fetched: RemoteValue[] = []

    for (const keys of toChunks(changed)) {
        const { data: values, error: valuesError } = await supabase
            .from(TABLE)
            .select("key, value, updated_at")
            .in("key", keys)

        if (valuesError) {
            throw valuesError
        }

        fetched.push(...(values as RemoteValue[]))
    }

    // Read again: edits made during the downloads count too.
    const meta = readSyncMeta()
    const now = Date.now()
    const downloads: RemoteValue[] = []
    const conflicts: SyncConflict[] = []

    for (const key of listLocalKeys()) {
        if (!remoteTimes.has(key)) {
            markEdited(meta, key, meta.times[key] ?? now)
        }
    }

    for (const row of fetched) {
        const device = readLocal(row.key)
        const remoteTime = Date.parse(row.updated_at)

        if (device === null || !isUnsynced(meta, row.key)) {
            downloads.push(row)
        } else if (sameInAccount(row.key, device.value, row.value)) {
            markSynced(meta, row.key, remoteTime)
        } else {
            conflicts.push({
                key: row.key,
                device: toAccountValue(row.key, device.value),
                deviceTime: meta.times[row.key],
                account: toAccountValue(row.key, row.value),
                accountTime: remoteTime,
            })
        }
    }

    writeSyncMeta(meta)

    if (conflicts.length > 0) {
        heldDownloads = downloads
        setStatus({ state: "conflict", conflicts: conflicts, open: true })

        return false
    }

    applyRemote(downloads)

    return true
}

const push = async (owner: string) => {
    const meta = readSyncMeta()
    const rows: UploadRow[] = []
    // The edit time each key had when read, so edits made during the
    // upload stay pending.
    const handled = new Map<string, number | undefined>()

    for (const key of meta.pending) {
        const time = meta.times[key]
        const parsed = readLocal(key)

        handled.set(key, time)

        // Gone or not JSON: nothing the app could read back anyway.
        if (parsed !== null) {
            rows.push({
                user_id: owner,
                key: key,
                value: toAccountValue(key, parsed.value),
                updated_at: new Date(time ?? Date.now()).toISOString(),
            })
        }
    }

    for (const chunk of toChunks(rows)) {
        const { error } = await supabase
            .from(TABLE)
            .upsert(chunk, { onConflict: "user_id,key" })

        if (error) {
            throw error
        }
    }

    const after = readSyncMeta()

    for (const row of rows) {
        const time = Date.parse(row.updated_at)

        if (after.times[row.key] === handled.get(row.key)) {
            markSynced(after, row.key, time)
        }
    }

    after.pending = after.pending.filter((key) => {
        return !handled.has(key) || after.times[key] !== handled.get(key)
    })
    writeSyncMeta(after)
}

const run = async (withPull: boolean) => {
    const owner = userId

    if (owner === null || status.state === "conflict") {
        return
    }

    needsPull ||= withPull

    if (running) {
        queued = true

        return
    }

    running = true
    setStatus({ state: "syncing" })

    try {
        do {
            const pullNow = needsPull

            queued = false
            needsPull = false

            if (pullNow && !(await pull())) {
                return
            }

            await push(owner)
        } while (queued)

        if (userId === owner) {
            setStatus({ state: "synced" })
        }
    } catch (error) {
        if (userId !== owner) {
            return
        }

        setStatus({
            state: "error",
            message:
                isRecord(error) && typeof error.message === "string"
                    ? error.message
                    : "Could not reach your account.",
        })
    } finally {
        running = false
    }
}

const schedulePush = () => {
    if (userId === null) {
        return
    }

    window.clearTimeout(pushTimer)
    pushTimer = window.setTimeout(() => {
        void run(false)
    }, PUSH_DELAY)
}

const handleAuthChange = () => {
    const auth = readAuth()
    const next = auth.status === "signedIn" ? auth.userId : null

    if (next === userId) {
        return
    }

    userId = next
    heldDownloads = []
    window.clearTimeout(pushTimer)
    setStatus({ state: "off" })

    if (userId !== null) {
        void run(true)
    }
}

// Back on the tab: get edits from other devices. Leaving it: upload now.
const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
        void run(true)

        return
    }

    window.clearTimeout(pushTimer)
    void run(false)
}

const start = () => {
    if (started) {
        return
    }

    started = true
    subscribeToAuth(handleAuthChange)
    subscribeToLocalChanges(schedulePush)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    handleAuthChange()
}

export const readSyncStatus = () => {
    return status
}

export const subscribeToSyncStatus = (onChange: () => void) => {
    start()
    listeners.add(onChange)

    return () => {
        listeners.delete(onChange)
    }
}

export const retrySync = () => {
    void run(true)
}

export const openSyncConflict = () => {
    if (status.state === "conflict") {
        setStatus({ ...status, open: true })
    }
}

// Closing without a choice keeps sync paused until the next login or visit.
export const closeSyncConflict = () => {
    if (status.state === "conflict") {
        setStatus({ ...status, open: false })
    }
}

export const resolveSyncConflict = (choice: SyncChoice) => {
    if (status.state !== "conflict") {
        return
    }

    const conflicts = status.conflicts
    const downloads = [...heldDownloads]
    const now = Date.now()
    let plannerChanged = false

    heldDownloads = []

    for (const conflict of conflicts) {
        if (choice === "account") {
            downloads.push({
                key: conflict.key,
                value: conflict.account,
                updated_at: new Date(conflict.accountTime).toISOString(),
            })
        }
    }

    applyRemote(downloads)

    if (choice !== "account") {
        const meta = readSyncMeta()

        for (const conflict of conflicts) {
            const value =
                choice === "device"
                    ? conflict.device
                    : mergeSyncedValue(
                          conflict.key,
                          conflict.device,
                          conflict.account,
                          (conflict.deviceTime ?? 0) > conflict.accountTime,
                      )

            storeLocally(conflict.key, value)
            plannerChanged ||= isPlannerKey(conflict.key)
            // Edited now, so it replaces the account's copy on upload.
            markEdited(meta, conflict.key, now)
            meta.synced[conflict.key] = conflict.accountTime
        }

        writeSyncMeta(meta)
    }

    if (plannerChanged) {
        bumpStorageRevision()
    }

    setStatus({ state: "syncing" })
    void run(false)
}
