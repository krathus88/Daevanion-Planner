import { useSyncExternalStore } from "react"

// Bumped when an import rewrites saved data the open board read on mount,
// so the board remounts and reads it again. The notice says what changed
// and is shown once the board is back.
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
