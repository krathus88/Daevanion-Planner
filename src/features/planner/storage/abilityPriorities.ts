import type { ClassPreset } from "@config/classPresets"
import { readBoardProgress } from "./boardStorage"
import { MAIN_BOARD_IDS, type MainBoardId } from "@config/boards"
import { readClassSettings, writeClassSettings } from "./classSettings"
import { isRecord } from "./isRecord"

export type AbilityPriorities = Readonly<Record<string, number>>

// Missing means 0.
export type AbilityMinimums = Readonly<Record<string, number>>

// Missing means no limit.
export type AbilityMaximums = Readonly<Record<string, number>>

export type MinimumShortfall = {
    abilityId: string
    name: string
    required: number
    achieved: number
}

type AbilityField = "priority" | "min" | "max"

const readSavedAbilities = (
    classId: string,
    source?: Record<string, unknown>,
) => {
    const value = readClassSettings(classId, "abilities", source)
    if (value === undefined) {
        return {}
    }

    if (!isRecord(value)) {
        throw new Error("Saved ability settings are invalid.")
    }

    return value
}

const readSavedField = (
    saved: Record<string, unknown>,
    abilityId: string,
    field: AbilityField,
) => {
    const ability = saved[abilityId]
    return isRecord(ability) ? ability[field] : undefined
}

// Abilities missing from `values` lose the field.
const writeAbilityField = (
    classId: string,
    field: AbilityField,
    values: Readonly<Record<string, number>>,
) => {
    let saved: Record<string, unknown>
    try {
        saved = readSavedAbilities(classId)
    } catch {
        saved = {}
    }

    const ids = new Set([...Object.keys(saved), ...Object.keys(values)])
    writeClassSettings(
        classId,
        "abilities",
        Object.fromEntries(
            [...ids].map((id) => {
                const ability = isRecord(saved[id]) ? { ...saved[id] } : {}
                if (values[id] === undefined) {
                    delete ability[field]
                } else {
                    ability[field] = values[id]
                }

                return [id, ability]
            }),
        ),
    )
}

export const defaultAbilityPriorities = (
    classPreset: ClassPreset,
): Record<string, number> => {
    return Object.fromEntries(
        classPreset.abilities.map((ability, index) => [
            ability.id,
            ability.priority ?? index + 2,
        ]),
    )
}

export const readAbilityPriorities = (
    classPreset: ClassPreset,
    source?: Record<string, unknown>,
): Record<string, number> => {
    const defaults = defaultAbilityPriorities(classPreset)

    try {
        const saved = readSavedAbilities(classPreset.id, source)

        return Object.fromEntries(
            classPreset.abilities.map((ability) => {
                const priority = readSavedField(saved, ability.id, "priority")
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
        writeAbilityField(classId, "priority", priorities)
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save ability priorities: ${error.message}`
            : "Could not save ability priorities."
    }
}

export const readAbilityMinimums = (
    classPreset: ClassPreset,
    source?: Record<string, unknown>,
): Record<string, number> => {
    try {
        const saved = readSavedAbilities(classPreset.id, source)

        return Object.fromEntries(
            classPreset.abilities.flatMap((ability) => {
                const minimum = readSavedField(saved, ability.id, "min")
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
    source?: Record<string, unknown>,
): Record<string, number> => {
    try {
        const saved = readSavedAbilities(classPreset.id, source)

        return Object.fromEntries(
            classPreset.abilities.flatMap((ability) => {
                const maximum = readSavedField(saved, ability.id, "max")
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
        writeAbilityField(classId, "max", maximums)
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save ability maximums: ${error.message}`
            : "Could not save ability maximums."
    }
}

const DEFAULT_MINIMUM = 2
const DEFAULT_MINIMUM_BELOW_RANK = 5

export const abilityNodeCounts = (
    classPreset: ClassPreset,
    boards: readonly MainBoardId[] = MAIN_BOARD_IDS,
) => {
    const counts = new Map<string, number>()
    for (const layoutName of boards) {
        const assignments = classPreset.assignments[layoutName]
        for (const abilityId of Object.values(assignments ?? {})) {
            counts.set(abilityId, (counts.get(abilityId) ?? 0) + 1)
        }
    }

    return counts
}

// Defaults: rank 1 every node, ranks 2-4 +2, the rest +0; capped at the
// node count.
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
        writeAbilityField(classId, "min", minimums)
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save ability minimums: ${error.message}`
            : "Could not save ability minimums."
    }
}

export const readSharedAbilityUpgradeCounts = (
    classPreset: ClassPreset,
    boards: readonly MainBoardId[] = MAIN_BOARD_IDS,
) => {
    const counts = new Map<string, number>()
    for (const layoutName of boards) {
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

type PriorityBoardPlan = {
    targetCells: string[]
    plannedPath: string[]
    plannedCost: number
}

export type PriorityPlans = Record<MainBoardId, PriorityBoardPlan>
