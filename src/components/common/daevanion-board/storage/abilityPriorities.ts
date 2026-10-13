import type { ClassPreset } from "../../../../config/classPresets"
import { readBoardProgress } from "./boardStorage"
import { layouts, type BoardLayoutName } from "../config/layouts"

export type AbilityPriorities = Readonly<Record<string, number>>

// Minimum number of upgrades (nodes on a route, across all boards) the
// all-board optimizer must reserve for an ability. Missing means 0.
export type AbilityMinimums = Readonly<Record<string, number>>

// Most upgrades the all-board optimizer will choose for an ability. A
// missing entry means no limit.
export type AbilityMaximums = Readonly<Record<string, number>>

export type MinimumShortfall = {
    abilityId: string
    name: string
    required: number
    achieved: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

const keyFor = (classId: string) => `daevanion:ability-priorities:v1:${classId}`
const maximumsKeyFor = (classId: string) =>
    `daevanion:ability-maximums:v1:${classId}`
const minimumsKeyFor = (classId: string) =>
    `daevanion:ability-minimums:v1:${classId}`

export const defaultAbilityPriorities = (
    classPreset: ClassPreset,
): Record<string, number> =>
    Object.fromEntries(
        classPreset.abilities.map((ability, index) => [
            ability.id,
            ability.priority ?? index + 2,
        ]),
    )

export const readAbilityPriorities = (
    classPreset: ClassPreset,
): Record<string, number> => {
    const defaults = defaultAbilityPriorities(classPreset)

    try {
        const raw = window.localStorage.getItem(keyFor(classPreset.id))
        if (raw === null) {
            return defaults
        }

        const value: unknown = JSON.parse(raw)
        if (!isRecord(value)) {
            throw new Error("Saved ability priorities are invalid.")
        }

        return Object.fromEntries(
            classPreset.abilities.map((ability) => {
                const priority = value[ability.id]
                return [
                    ability.id,
                    typeof priority === "number" &&
                    Number.isInteger(priority) &&
                    priority >= 1
                        ? priority
                        : defaults[ability.id],
                ]
            }),
        )
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? `Could not read ability priorities: ${error.message}`
                : "Could not read ability priorities.",
            { cause: error },
        )
    }
}

export const writeAbilityPriorities = (
    classId: string,
    priorities: AbilityPriorities,
) => {
    try {
        window.localStorage.setItem(keyFor(classId), JSON.stringify(priorities))
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save ability priorities: ${error.message}`
            : "Could not save ability priorities."
    }
}

export const readAbilityMinimums = (
    classPreset: ClassPreset,
): Record<string, number> => {
    try {
        const raw = window.localStorage.getItem(minimumsKeyFor(classPreset.id))
        if (raw === null) {
            return {}
        }

        const value: unknown = JSON.parse(raw)
        if (!isRecord(value)) {
            throw new Error("Saved ability minimums are invalid.")
        }

        return Object.fromEntries(
            classPreset.abilities.flatMap((ability) => {
                const minimum = value[ability.id]
                return typeof minimum === "number" &&
                    Number.isInteger(minimum) &&
                    minimum >= 0
                    ? [[ability.id, minimum]]
                    : []
            }),
        )
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? `Could not read ability minimums: ${error.message}`
                : "Could not read ability minimums.",
            { cause: error },
        )
    }
}

export const readAbilityMaximums = (
    classPreset: ClassPreset,
): Record<string, number> => {
    try {
        const raw = window.localStorage.getItem(maximumsKeyFor(classPreset.id))
        if (raw === null) {
            return {}
        }

        const value: unknown = JSON.parse(raw)
        if (!isRecord(value)) {
            throw new Error("Saved ability maximums are invalid.")
        }

        return Object.fromEntries(
            classPreset.abilities.flatMap((ability) => {
                const maximum = value[ability.id]
                return typeof maximum === "number" &&
                    Number.isInteger(maximum) &&
                    maximum >= 0
                    ? [[ability.id, maximum]]
                    : []
            }),
        )
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? `Could not read ability maximums: ${error.message}`
                : "Could not read ability maximums.",
            { cause: error },
        )
    }
}

export const writeAbilityMaximums = (
    classId: string,
    maximums: AbilityMaximums,
) => {
    try {
        window.localStorage.setItem(
            maximumsKeyFor(classId),
            JSON.stringify(maximums),
        )
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save ability maximums: ${error.message}`
            : "Could not save ability maximums."
    }
}

const DEFAULT_MINIMUM = 2
const DEFAULT_MINIMUM_BELOW_RANK = 5

// Number of nodes each ability has across all boards: the most upgrades it
// can ever get.
export const abilityNodeCounts = (classPreset: ClassPreset) => {
    const counts = new Map<string, number>()
    for (const assignments of Object.values(classPreset.assignments)) {
        for (const abilityId of Object.values(assignments ?? {})) {
            counts.set(abilityId, (counts.get(abilityId) ?? 0) + 1)
        }
    }

    return counts
}

// Minimums the user set win; otherwise rank 1 defaults to every node the
// ability has, ranks 2-4 to +2 and the rest to +0. Always capped at the
// ability's node count.
export const resolveAbilityMinimums = (
    classPreset: ClassPreset,
    priorities: AbilityPriorities,
    stored: AbilityMinimums,
): Record<string, number> => {
    const nodeCounts = abilityNodeCounts(classPreset)

    return Object.fromEntries(
        classPreset.abilities.map((ability) => {
            const priority = priorities[ability.id]
            const fallback =
                priority === 1
                    ? (nodeCounts.get(ability.id) ?? 0)
                    : priority !== undefined &&
                        priority < DEFAULT_MINIMUM_BELOW_RANK
                      ? DEFAULT_MINIMUM
                      : 0
            return [
                ability.id,
                Math.min(
                    nodeCounts.get(ability.id) ?? 0,
                    stored[ability.id] ?? fallback,
                ),
            ]
        }),
    )
}

export const writeAbilityMinimums = (
    classId: string,
    minimums: AbilityMinimums,
) => {
    try {
        window.localStorage.setItem(
            minimumsKeyFor(classId),
            JSON.stringify(minimums),
        )
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save ability minimums: ${error.message}`
            : "Could not save ability minimums."
    }
}

// Upgrades per ability across every board's current route.
export const readSharedAbilityUpgradeCounts = (classPreset: ClassPreset) => {
    const counts = new Map<string, number>()
    for (const layoutName of Object.keys(layouts) as BoardLayoutName[]) {
        const progress = readBoardProgress(classPreset.id, layoutName)
        if (progress.error) {
            throw new Error(progress.error)
        }

        const assignments = classPreset.assignments[layoutName] ?? {}
        for (const key of progress.value?.plannedPath ?? []) {
            const abilityId = assignments[key]
            if (abilityId) {
                counts.set(abilityId, (counts.get(abilityId) ?? 0) + 1)
            }
        }
    }

    return counts
}

export type PriorityBoardPlan = {
    targetCells: string[]
    plannedPath: string[]
    plannedCost: number
}

export type PriorityPlans = Record<BoardLayoutName, PriorityBoardPlan>
