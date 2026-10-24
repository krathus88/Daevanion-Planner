import { useSyncExternalStore } from "react"

// Bumped by imports so the open board remounts and rereads storage.
type StorageRevision = {
    revision: number
    notice: string | null
}

const CHANGE_EVENT = "daevanion-storage-revision"

let current: StorageRevision = { revision: 0, notice: null }

export const bumpStorageRevision = (notice: string | null = null) => {
    current = { revision: current.revision + 1, notice: notice }
    window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const clearStorageNotice = () => {
    if (current.notice === null) {
        return
    }

    current = { ...current, notice: null }
    window.dispatchEvent(new Event(CHANGE_EVENT))
}

const subscribe = (onChange: () => void) => {
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
}

const getSnapshot = () => current

export const useStorageRevision = () => {
    return useSyncExternalStore(subscribe, getSnapshot)
}
