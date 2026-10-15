import { isRecord } from "./isRecord"

// Every optimizer setting for one class is stored under one key, one
// section per setting.
export type ClassSettingsSection =
    "abilities" | "specialPriorities" | "rankOrder" | "stats"

const keyFor = (classId: string) => {
    return `daevanion:v1:${classId}:settings`
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
}
