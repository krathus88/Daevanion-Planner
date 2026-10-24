import { MAIN_BOARD_IDS, type MainBoardId } from "@config/boards"
import type { ClassPreset } from "@config/classPresets"
import { useEffect, useState } from "react"
import { errorMessage } from "@planner/logic/errorMessage"
import {
    abilityNodeCounts,
    defaultAbilityPriorities,
    readAbilityMaximums,
    readAbilityMinimums,
    readAbilityPriorities,
    readSharedAbilityUpgradeCounts,
    resolveAbilityMinimums,
    writeAbilityMaximums,
    writeAbilityMinimums,
    writeAbilityPriorities,
    type AbilityMaximums,
    type AbilityMinimums,
} from "@planner/storage/abilityPriorities"
import { subscribeToBoardStorage } from "@planner/storage/boardStorage"
import { subscribeToClassSettings } from "@planner/storage/classSettings"

const readOr = <T>(
    read: () => T,
    fallback: T,
    failure: string,
    errors: string[],
) => {
    try {
        return read()
    } catch (error) {
        errors.push(errorMessage(error, failure))
        return fallback
    }
}

const readLimits = (classPreset: ClassPreset, errors: string[]) => {
    return {
        priorities: readOr(
            () => readAbilityPriorities(classPreset),
            defaultAbilityPriorities(classPreset),
            "Could not read ability priorities.",
            errors,
        ),
        minimums: readOr<AbilityMinimums>(
            () => readAbilityMinimums(classPreset),
            {},
            "Could not read ability minimums.",
            errors,
        ),
        maximums: readOr<AbilityMaximums>(
            () => readAbilityMaximums(classPreset),
            {},
            "Could not read ability maximums.",
            errors,
        ),
    }
}

const readInitialLimits = (
    classPreset: ClassPreset,
    boards: readonly MainBoardId[],
) => {
    const errors: string[] = []

    return {
        ...readLimits(classPreset, errors),
        upgradeCounts: readOr(
            () => readSharedAbilityUpgradeCounts(classPreset, boards),
            new Map<string, number>(),
            "Could not read shared ability upgrades.",
            errors,
        ),
        error: errors.join(" ") || null,
    }
}

export const useAbilityLimits = (
    classPreset: ClassPreset,
    layout?: MainBoardId,
) => {
    const boards: readonly MainBoardId[] = layout ? [layout] : MAIN_BOARD_IDS
    const [initial] = useState(() => readInitialLimits(classPreset, boards))
    const [priorities, setPriorities] = useState(initial.priorities)
    const [minimums, setMinimums] = useState(initial.minimums)
    const [maximums, setMaximums] = useState(initial.maximums)
    const [upgradeCounts, setUpgradeCounts] = useState(initial.upgradeCounts)
    const [error, setError] = useState<string | null>(initial.error)

    useEffect(
        () =>
            subscribeToBoardStorage(() => {
                try {
                    setUpgradeCounts(
                        readSharedAbilityUpgradeCounts(
                            classPreset,
                            layout ? [layout] : MAIN_BOARD_IDS,
                        ),
                    )
                } catch (readError) {
                    setError(
                        errorMessage(
                            readError,
                            "Could not read shared ability upgrades.",
                        ),
                    )
                }
            }),
        [classPreset, layout],
    )

    useEffect(
        () =>
            subscribeToClassSettings(classPreset.id, () => {
                const errors: string[] = []
                const next = readLimits(classPreset, errors)
                setPriorities(next.priorities)
                setMinimums(next.minimums)
                setMaximums(next.maximums)
                setError(errors.join(" ") || null)
            }),
        [classPreset],
    )

    const updatePriority = (abilityId: string, priority: number) => {
        const nextPriorities = { ...priorities, [abilityId]: priority }
        const writeError = writeAbilityPriorities(
            classPreset.id,
            nextPriorities,
        )
        if (writeError) {
            setError(writeError)
            return
        }

        setPriorities(nextPriorities)
        setError(null)
    }

    const saveLimits = (
        nextMinimums: AbilityMinimums,
        nextMaximums: AbilityMaximums,
    ) => {
        const writeError =
            writeAbilityMinimums(classPreset.id, nextMinimums) ??
            writeAbilityMaximums(classPreset.id, nextMaximums)
        if (writeError) {
            setError(writeError)
            return
        }

        setMinimums(nextMinimums)
        setMaximums(nextMaximums)
        setError(null)
    }

    // Min and Max stay linked: moving one past the other moves both.
    const updateMinimum = (abilityId: string, minimum: number) => {
        const maximum = maximums[abilityId]
        saveLimits(
            { ...minimums, [abilityId]: minimum },
            maximum !== undefined && minimum > maximum
                ? { ...maximums, [abilityId]: minimum }
                : maximums,
        )
    }

    const updateMaximum = (abilityId: string, maximum: number | null) => {
        const nextMaximums = { ...maximums }
        if (maximum === null) {
            delete nextMaximums[abilityId]
        } else {
            nextMaximums[abilityId] = maximum
        }

        saveLimits(
            maximum !== null && (resolvedMinimums[abilityId] ?? 0) > maximum
                ? { ...minimums, [abilityId]: maximum }
                : minimums,
            nextMaximums,
        )
    }

    const nodeCounts = abilityNodeCounts(classPreset)
    const scopedNodeCounts = abilityNodeCounts(classPreset, boards)
    const resolvedMinimums = resolveAbilityMinimums(
        classPreset,
        priorities,
        minimums,
    )

    return {
        priorities: priorities,
        minimums: resolvedMinimums,
        maximums: maximums,
        upgradeCounts: upgradeCounts,
        nodeCounts: nodeCounts,
        scopedNodeCounts: scopedNodeCounts,
        error: error,
        updatePriority: updatePriority,
        updateMinimum: updateMinimum,
        updateMaximum: updateMaximum,
    }
}
