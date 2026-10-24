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

// Matches by id or identical nodes, so importing twice adds nothing.
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
