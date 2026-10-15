import type { BoardId } from "@config/boards"
import {
    readSavedBoards,
    readSavedPlanners,
    writeSavedBoards,
    writeSavedPlanners,
    type SavedBoard,
    type SavedPlanner,
} from "./boardStorage"

const sameCells = (a: string[], b: string[]) => {
    const cells = new Set(a)
    return cells.size === new Set(b).size && b.every((cell) => cells.has(cell))
}

const isSamePlanner = (a: SavedPlanner, b: SavedPlanner) => {
    return (
        a.id === b.id ||
        (a.plannedCost === b.plannedCost &&
            sameCells(a.targetCells, b.targetCells) &&
            sameCells(a.plannedPath, b.plannedPath))
    )
}

const isSameBoard = (a: SavedBoard, b: SavedBoard) => {
    return a.id === b.id || sameCells(a.selectedCells, b.selectedCells)
}

// The given entries the board doesn't already have, by id or by
// identical nodes, so importing or saving twice adds nothing new.
export const newSavedEntries = (
    classId: string,
    layout: BoardId,
    planners: SavedPlanner[],
    boards: SavedBoard[],
) => {
    const savedPlanners = readSavedPlanners(classId, layout)
    const savedBoards = readSavedBoards(classId, layout)
    if (savedPlanners.error || savedBoards.error) {
        throw new Error(savedPlanners.error ?? savedBoards.error ?? "")
    }

    // Also drops repeats among the given entries.
    const keepNew = <T>(
        existing: T[],
        entries: T[],
        isSame: (a: T, b: T) => boolean,
    ) => {
        const kept: T[] = []
        for (const entry of entries) {
            if (![...existing, ...kept].some((other) => isSame(other, entry))) {
                kept.push(entry)
            }
        }

        return kept
    }

    return {
        planners: keepNew(savedPlanners.value ?? [], planners, isSamePlanner),
        boards: keepNew(savedBoards.value ?? [], boards, isSameBoard),
    }
}

// Adds entries to the top of the board's saved lists, as saving does.
// Returns an error message or null.
export const addSavedEntries = (
    classId: string,
    layout: BoardId,
    planners: SavedPlanner[],
    boards: SavedBoard[],
) => {
    const savedPlanners = readSavedPlanners(classId, layout)
    const savedBoards = readSavedBoards(classId, layout)
    if (savedPlanners.error || savedBoards.error) {
        return savedPlanners.error ?? savedBoards.error
    }

    return (
        (planners.length > 0
            ? writeSavedPlanners(classId, layout, [
                  ...planners,
                  ...(savedPlanners.value ?? []),
              ])
            : null) ??
        (boards.length > 0
            ? writeSavedBoards(classId, layout, [
                  ...boards,
                  ...(savedBoards.value ?? []),
              ])
            : null)
    )
}
