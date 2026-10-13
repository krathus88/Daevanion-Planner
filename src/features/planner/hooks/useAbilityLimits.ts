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

// Reads one setting, falling back (and collecting the error) if storage
// holds something unreadable.
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

const readInitialLimits = (classPreset: ClassPreset) => {
    const errors: string[] = []

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
        upgradeCounts: readOr(
            () => readSharedAbilityUpgradeCounts(classPreset),
            new Map<string, number>(),
            "Could not read shared ability upgrades.",
            errors,
        ),
        error: errors.join(" ") || null,
    }
}

// Each ability's priority rank and Min/Max upgrade limits, plus how many
// upgrades the boards' current routes already give it.
export const useAbilityLimits = (classPreset: ClassPreset) => {
    const [initial] = useState(() => readInitialLimits(classPreset))
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
                        readSharedAbilityUpgradeCounts(classPreset),
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

    // Min and Max stay linked: raising Min above Max raises Max, and
    // lowering Max below Min lowers Min.
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

    // An ability can't need more upgrades than it has nodes across all boards.
    const nodeCounts = abilityNodeCounts(classPreset)
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
        error: error,
        updatePriority: updatePriority,
        updateMinimum: updateMinimum,
        updateMaximum: updateMaximum,
    }
}
