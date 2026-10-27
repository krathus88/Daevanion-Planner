import { CLASS_NAMES, isClassId } from "@config/classPresets/classInfo"
import { isRecord } from "@planner/storage/isRecord"
import type { SyncConflict } from "./cloudSync"
import { getPlannerClassId, PETS_KEY, TIMERS_KEY } from "./syncedKeys"

export type ConflictSideSummary = {
    detail: string
    // Latest edit; missing when the data predates sync.
    time: number | undefined
}

export type ConflictSummaryRow = {
    id: string
    label: string
    device: ConflictSideSummary
    account: ConflictSideSummary
}

type Group = {
    label: string
    kind: "planner" | "pets" | "timers"
    deviceCount: number
    accountCount: number
    deviceTime: number | undefined
    accountTime: number | undefined
}

const SAVED_SUFFIXES = [":saved-boards", ":saved-planners"]

const countItems = (key: string, value: unknown) => {
    if (key === PETS_KEY) {
        return isRecord(value) && isRecord(value.levels)
            ? Object.keys(value.levels).length
            : 0
    }

    for (const suffix of SAVED_SUFFIXES) {
        if (key.endsWith(suffix) && Array.isArray(value)) {
            return value.length
        }
    }

    return 0
}

const latest = (a: number | undefined, b: number | undefined) => {
    if (a === undefined) {
        return b
    }

    return b === undefined ? a : Math.max(a, b)
}

const getGroup = (key: string) => {
    if (key === PETS_KEY) {
        return { id: "pets", label: "Pets", kind: "pets" as const }
    }

    if (key === TIMERS_KEY) {
        return { id: "timers", label: "Timers", kind: "timers" as const }
    }

    const classId = getPlannerClassId(key)

    return {
        id: `planner:${classId}`,
        label: isClassId(classId) ? CLASS_NAMES[classId] : classId,
        kind: "planner" as const,
    }
}

const describe = (kind: Group["kind"], count: number) => {
    if (kind === "pets") {
        return `${count} ${count === 1 ? "pet" : "pets"} with levels`
    }

    if (kind === "timers") {
        return "Timer settings"
    }

    return count > 0
        ? `${count} saved ${count === 1 ? "plan" : "plans"}`
        : "Board plans and settings"
}

// One row per class, plus pets and timers, comparing what each side has.
export const summarizeConflicts = (conflicts: SyncConflict[]) => {
    const groups = new Map<string, Group>()

    for (const conflict of conflicts) {
        const info = getGroup(conflict.key)
        const group = groups.get(info.id) ?? {
            label: info.label,
            kind: info.kind,
            deviceCount: 0,
            accountCount: 0,
            deviceTime: undefined,
            accountTime: undefined,
        }

        group.deviceCount += countItems(conflict.key, conflict.device)
        group.accountCount += countItems(conflict.key, conflict.account)
        group.deviceTime = latest(group.deviceTime, conflict.deviceTime)
        group.accountTime = latest(group.accountTime, conflict.accountTime)
        groups.set(info.id, group)
    }

    const rows: ConflictSummaryRow[] = []

    for (const [id, group] of groups) {
        rows.push({
            id: id,
            label: group.label,
            device: {
                detail: describe(group.kind, group.deviceCount),
                time: group.deviceTime,
            },
            account: {
                detail: describe(group.kind, group.accountCount),
                time: group.accountTime,
            },
        })
    }

    return rows
}

export const formatEditTime = (time: number | undefined) => {
    if (time === undefined) {
        return "Saved before sync"
    }

    return `Edited ${new Date(time).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    })}`
}
