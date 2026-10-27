import { setStoredItem } from "@account/sync/syncMeta"
import { isRecord } from "./isRecord"

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

export const readAllClassSettings = (classId: string) => {
    return readAll(classId)
}

export const replaceClassSettings = (
    classId: string,
    settings: Record<string, unknown>,
) => {
    setStoredItem(keyFor(classId), JSON.stringify(settings))
    notifyChange(classId)
}

export const readClassSettings = (
    classId: string,
    section: ClassSettingsSection,
    source?: Record<string, unknown>,
): unknown => {
    return (source ?? readAll(classId))[section]
}

// Overwrites unreadable saves so a bad save can't block new ones.
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

    setStoredItem(
        keyFor(classId),
        JSON.stringify({ ...settings, [section]: value }),
    )
    notifyChange(classId)
}
