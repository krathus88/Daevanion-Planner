import { DEFAULT_CLASS_ID, isClassId, type ClassId } from "@config/classPresets"
import { DEFAULT_BOARD_ID, isBoardId, type BoardId } from "@config/boards"
import { isRecord } from "./isRecord"

// The class and board last open in the planner. Pages without them in the
// URL (Timers) show this class, and the Planner link returns to this board.
export type PlannerLocation = {
    classId: ClassId
    layout: BoardId
}

const KEY = "daevanion:planner-location"
const CHANGE_EVENT = "daevanion-planner-location-change"

const DEFAULT_LOCATION: PlannerLocation = {
    classId: DEFAULT_CLASS_ID,
    layout: DEFAULT_BOARD_ID,
}

// useSyncExternalStore needs the same object back until the data changes.
let cached: { raw: string | null; location: PlannerLocation } | null = null

const parse = (raw: string | null): PlannerLocation => {
    if (raw === null) {
        return DEFAULT_LOCATION
    }

    try {
        const value: unknown = JSON.parse(raw)

        if (
            isRecord(value) &&
            typeof value.classId === "string" &&
            isClassId(value.classId) &&
            typeof value.layout === "string" &&
            isBoardId(value.layout)
        ) {
            return { classId: value.classId, layout: value.layout }
        }
    } catch {
        // Fall through to the default.
    }

    return DEFAULT_LOCATION
}

export const readPlannerLocation = () => {
    let raw: string | null = null

    try {
        raw = window.localStorage.getItem(KEY)
    } catch {
        // Storage is blocked; fall back to the default.
    }

    if (!cached || cached.raw !== raw) {
        cached = { raw: raw, location: parse(raw) }
    }

    return cached.location
}

export const writePlannerLocation = (location: PlannerLocation) => {
    const current = readPlannerLocation()

    if (
        current.classId === location.classId &&
        current.layout === location.layout
    ) {
        return
    }

    try {
        window.localStorage.setItem(KEY, JSON.stringify(location))
    } catch {
        // Only lasts until the page reloads.
        cached = { raw: null, location: location }
    }

    window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const subscribeToPlannerLocation = (onChange: () => void) => {
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === null || event.key === KEY) {
            onChange()
        }
    }

    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
        window.removeEventListener(CHANGE_EVENT, onChange)
        window.removeEventListener("storage", handleStorageChange)
    }
}
