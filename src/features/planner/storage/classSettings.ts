import { isRecord } from "./isRecord"

// Every optimizer setting for one class is stored under one key, one
// section per setting.
export type ClassSettingsSection =
    "abilities" | "specialPriorities" | "rankOrder" | "stats" | "ariel"

const SETTINGS_CHANGE_EVENT = "daevanion-settings-change"

const keyFor = (classId: string) => {
    return `daevanion:v1:${classId}:settings`
}

const notifyChange = (classId: string) => {
    window.dispatchEvent(
        new CustomEvent<string>(SETTINGS_CHANGE_EVENT, { detail: classId }),
    )
}

// Fires when a class's settings change, here or in another tab, so every
// editor showing them (This board and All boards) stays in sync.
export const subscribeToClassSettings = (
    classId: string,
    onChange: () => void,
) => {
    const handleLocalChange = (event: Event) => {
        if ((event as CustomEvent<string>).detail === classId) {
            onChange()
        }
    }
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === null || event.key === keyFor(classId)) {
            onChange()
        }
    }

    window.addEventListener(SETTINGS_CHANGE_EVENT, handleLocalChange)
    window.addEventListener("storage", handleStorageChange)
    return () => {
        window.removeEventListener(SETTINGS_CHANGE_EVENT, handleLocalChange)
        window.removeEventListener("storage", handleStorageChange)
    }
}

const readAll = (classId: string): Record<string, unknown> => {
    const raw = window.localStorage.getItem(keyFor(classId))
    if (raw === null) {
        return {}
    }

    const value: unknown = JSON.parse(raw)
    if (!isRecord(value)) {
        throw new Error("Saved settings are invalid.")
    }

    return value
}

// Every section at once, for backups and share links. Throws if storage
// can't be read.
export const readAllClassSettings = (classId: string) => {
    return readAll(classId)
}

// Replaces every section, e.g. with an imported or shared set. Throws if
// storage can't be written.
export const replaceClassSettings = (
    classId: string,
    settings: Record<string, unknown>,
) => {
    window.localStorage.setItem(keyFor(classId), JSON.stringify(settings))
    notifyChange(classId)
}

// Undefined when the section was never saved. Throws if storage can't be
// read. `source` reads from a given set instead, e.g. a shared link's.
export const readClassSettings = (
    classId: string,
    section: ClassSettingsSection,
    source?: Record<string, unknown>,
): unknown => {
    return (source ?? readAll(classId))[section]
}

// Replaces one section and keeps the others. Unreadable saved settings are
// overwritten, so a bad save can't block new ones. Throws if storage can't
// be written.
export const writeClassSettings = (
    classId: string,
    section: ClassSettingsSection,
    value: unknown,
) => {
    let settings: Record<string, unknown>
    try {
        settings = readAll(classId)
    } catch {
        settings = {}
    }

    window.localStorage.setItem(
        keyFor(classId),
        JSON.stringify({ ...settings, [section]: value }),
    )
    notifyChange(classId)
}
