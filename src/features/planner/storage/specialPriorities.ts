import { BOARD_IDS, type BoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import {
    SPECIAL_BONUSES,
    type SpecialBonusType,
} from "@planner/config/specialNodes"
import { readBoardProgress } from "./boardStorage"
import { readClassSettings, writeClassSettings } from "./classSettings"
import { isRecord } from "./isRecord"

// Rank of each special node bonus, on the same scale as ability ranks.
export type SpecialPriorities = Readonly<Record<SpecialBonusType, number>>

export const SPECIAL_BONUS_TYPES = Object.keys(
    SPECIAL_BONUSES,
) as SpecialBonusType[]

// For a special node with no bonus set in layouts.ts.
export const DEFAULT_SPECIAL_PRIORITY = 1

export const DEFAULT_SPECIAL_PRIORITIES = Object.fromEntries(
    SPECIAL_BONUS_TYPES.map((bonus) => [
        bonus,
        SPECIAL_BONUSES[bonus].defaultPriority,
    ]),
) as SpecialPriorities

export const readSpecialPriorities = (
    classId: string,
    source?: Record<string, unknown>,
): SpecialPriorities => {
    try {
        const value = readClassSettings(classId, "specialPriorities", source)
        if (value === undefined) {
            return DEFAULT_SPECIAL_PRIORITIES
        }

        if (!isRecord(value)) {
            throw new Error("Saved special node priorities are invalid.")
        }

        return Object.fromEntries(
            SPECIAL_BONUS_TYPES.map((bonus) => {
                const priority = value[bonus]
                return [
                    bonus,
                    typeof priority === "number" &&
                    Number.isInteger(priority) &&
                    priority >= 1
                        ? priority
                        : DEFAULT_SPECIAL_PRIORITIES[bonus],
                ]
            }),
        ) as SpecialPriorities
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? `Could not read special node priorities: ${error.message}`
                : "Could not read special node priorities.",
            { cause: error },
        )
    }
}

export const writeSpecialPriorities = (
    classId: string,
    priorities: SpecialPriorities,
) => {
    try {
        writeClassSettings(classId, "specialPriorities", priorities)
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save special node priorities: ${error.message}`
            : "Could not save special node priorities."
    }
}

export type SpecialNodeCount = {
    // Nodes with this bonus on the boards' current routes.
    taken: number
    // Nodes with this bonus on the counted boards.
    total: number
}

// Special nodes taken versus available, per bonus, across the given boards
// (all by default).
export const readSharedSpecialNodeCounts = (
    classId: string,
    boards: readonly BoardId[] = BOARD_IDS,
) => {
    const counts = {} as Record<SpecialBonusType, SpecialNodeCount>
    for (const bonus of SPECIAL_BONUS_TYPES) {
        counts[bonus] = { taken: 0, total: 0 }
    }

    for (const layout of boards) {
        const progress = readBoardProgress(classId, layout)
        if (progress.error) {
            throw new Error(progress.error)
        }

        const bonuses = layouts[layout].specialNodeBonuses
        for (const bonus of Object.values(bonuses)) {
            counts[bonus].total += 1
        }

        for (const key of progress.value?.plannedPath ?? []) {
            const bonus = bonuses[key]
            if (bonus) {
                counts[bonus].taken += 1
            }
        }
    }

    return counts
}
