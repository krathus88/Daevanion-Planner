import { BOARD_IDS, MAIN_BOARD_IDS, type BoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import { isRecord } from "./isRecord"
import { requestPersistentStorage } from "./persistStorage"

export type BoardProgress = {
    selectedCells: string[]
    availablePoints: number
    targetCells: string[]
    plannedPath: string[]
    plannedCost: number | null
    activePlanner?: ActivePlanner | null
}

export type ActivePlanner = {
    id: string
    name: string
    source: "saved" | "history"
}

export type BoardUndo = {
    selectedCells: string[]
}

export type PlannerUndo = {
    targetCells: string[]
    plannedPath: string[]
    plannedCost: number | null
}

export type SavedBoard = BoardUndo & {
    id: string
    name: string
    createdAt: number
    availablePoints: number
}

export type SavedPlanner = PlannerUndo & {
    id: string
    name: string
    createdAt: number
    availablePoints: number
}

export type SharedAllocation = {
    totalPoints: number
    selectedPlannerIds: Partial<Record<BoardId, string>>
}

type StorageRead<T> = {
    value: T | null
    error: string | null
}

const MAX_PLANNER_HISTORY = 25
const STORAGE_VERSION = "v1"
const STORAGE_CHANGE_EVENT = "daevanion-storage-change"
const PLANS_REPLACED_EVENT = "daevanion-plans-replaced"
const sharedAllocationKey = (classId: string) => {
    return `daevanion:${STORAGE_VERSION}:${classId}:shared-allocation`
}

const keyFor = (
    classId: string,
    kind:
        | "progress"
        | "board-undo"
        | "planner-undo"
        | "saved-boards"
        | "saved-planners"
        | "planner-history"
        | "wants",
    layout: BoardId,
) => {
    return `daevanion:${STORAGE_VERSION}:${classId}:${layout}:${kind}`
}

const read = <T>(
    key: string,
    isValid: (value: unknown) => value is T,
): StorageRead<T> => {
    try {
        const raw = window.localStorage.getItem(key)
        if (raw === null) {
            return { value: null, error: null }
        }

        const value: unknown = JSON.parse(raw)
        if (!isValid(value)) {
            return {
                value: null,
                error: "Saved board data is invalid and could not be loaded.",
            }
        }

        return { value: value, error: null }
    } catch (error) {
        return {
            value: null,
            error:
                error instanceof Error
                    ? `Could not read saved board data: ${error.message}`
                    : "Could not read saved board data.",
        }
    }
}

const write = (key: string, value: unknown) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value))
        window.dispatchEvent(
            new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key: key } }),
        )
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save board data: ${error.message}`
            : "Could not save board data."
    }
}

const remove = (key: string) => {
    try {
        window.localStorage.removeItem(key)
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not delete saved board data: ${error.message}`
            : "Could not delete saved board data."
    }
}

const isStringArray = (value: unknown): value is string[] => {
    return (
        Array.isArray(value) && value.every((item) => typeof item === "string")
    )
}

const isNonNegativeNumber = (value: unknown): value is number => {
    return typeof value === "number" && Number.isFinite(value) && value >= 0
}

const isNullableNumber = (value: unknown): value is number | null => {
    return (
        value === null || (typeof value === "number" && Number.isFinite(value))
    )
}

const isActivePlanner = (value: unknown): value is ActivePlanner => {
    return (
        isRecord(value) &&
        typeof value.id === "string" &&
        typeof value.name === "string" &&
        (value.source === "saved" || value.source === "history")
    )
}

const isBoardProgress = (value: unknown): value is BoardProgress => {
    return (
        isRecord(value) &&
        isStringArray(value.selectedCells) &&
        isNonNegativeNumber(value.availablePoints) &&
        isStringArray(value.targetCells) &&
        isStringArray(value.plannedPath) &&
        isNullableNumber(value.plannedCost) &&
        (value.activePlanner === undefined ||
            value.activePlanner === null ||
            isActivePlanner(value.activePlanner))
    )
}

const isBoardUndo = (value: unknown): value is BoardUndo => {
    return isRecord(value) && isStringArray(value.selectedCells)
}

const isPlannerUndo = (value: unknown): value is PlannerUndo => {
    return (
        isRecord(value) &&
        isStringArray(value.targetCells) &&
        isStringArray(value.plannedPath) &&
        isNullableNumber(value.plannedCost)
    )
}

export const isSavedBoard = (value: unknown): value is SavedBoard => {
    return (
        isRecord(value) &&
        typeof value.id === "string" &&
        typeof value.name === "string" &&
        typeof value.createdAt === "number" &&
        isNonNegativeNumber(value.availablePoints) &&
        isStringArray(value.selectedCells)
    )
}

export const isSavedPlanner = (value: unknown): value is SavedPlanner => {
    return (
        isRecord(value) &&
        typeof value.id === "string" &&
        typeof value.name === "string" &&
        typeof value.createdAt === "number" &&
        isNonNegativeNumber(value.availablePoints) &&
        isStringArray(value.targetCells) &&
        isStringArray(value.plannedPath) &&
        isNullableNumber(value.plannedCost)
    )
}

const isSharedAllocation = (value: unknown): value is SharedAllocation => {
    return (
        isRecord(value) &&
        isNonNegativeNumber(value.totalPoints) &&
        isRecord(value.selectedPlannerIds) &&
        Object.entries(value.selectedPlannerIds).every(
            ([layout, id]) =>
                Object.hasOwn(layouts, layout) && typeof id === "string",
        )
    )
}

export const readSharedAllocation = (classId: string) => {
    return read(sharedAllocationKey(classId), isSharedAllocation)
}

export const writeSharedAllocation = (
    classId: string,
    allocation: SharedAllocation,
) => {
    return write(sharedAllocationKey(classId), allocation)
}

export const DEFAULT_TOTAL_POINTS = 225

export const readSharedTotalPoints = (classId: string) => {
    return (
        readSharedAllocation(classId).value?.totalPoints ?? DEFAULT_TOTAL_POINTS
    )
}

export const writeSharedTotalPoints = (
    classId: string,
    totalPoints: number,
) => {
    return writeSharedAllocation(classId, {
        selectedPlannerIds: {},
        ...readSharedAllocation(classId).value,
        totalPoints: totalPoints,
    })
}

export const readRouteCostOfOtherBoards = (
    classId: string,
    layout: BoardId,
) => {
    return MAIN_BOARD_IDS.filter((other) => other !== layout).reduce(
        (total, other) =>
            total + (readBoardProgress(classId, other).value?.plannedCost ?? 0),
        0,
    )
}

export const subscribeToBoardStorage = (onChange: () => void) => {
    const handleLocalChange = () => {
        onChange()
    }
    const handleStorageChange = (event: StorageEvent) => {
        if (
            event.key === null ||
            event.key.startsWith(`daevanion:${STORAGE_VERSION}:`)
        ) {
            onChange()
        }
    }

    window.addEventListener(STORAGE_CHANGE_EVENT, handleLocalChange)
    window.addEventListener("storage", handleStorageChange)
    return () => {
        window.removeEventListener(STORAGE_CHANGE_EVENT, handleLocalChange)
        window.removeEventListener("storage", handleStorageChange)
    }
}

// For writes from outside the board, e.g. the all-board optimizer. No
// boards listed means all of them.
export const notifyPlansReplaced = (layouts?: BoardId[]) => {
    return window.dispatchEvent(
        new CustomEvent<BoardId[] | undefined>(PLANS_REPLACED_EVENT, {
            detail: layouts,
        }),
    )
}

export const subscribeToPlansReplaced = (
    onReplaced: (layouts: BoardId[] | undefined) => void,
) => {
    const handle = (event: Event) => {
        onReplaced((event as CustomEvent<BoardId[] | undefined>).detail)
    }
    window.addEventListener(PLANS_REPLACED_EVENT, handle)
    return () => window.removeEventListener(PLANS_REPLACED_EVENT, handle)
}

export const readBoardProgress = (classId: string, layout: BoardId) => {
    return read(keyFor(classId, "progress", layout), isBoardProgress)
}

export const writeBoardProgress = (
    classId: string,
    layout: BoardId,
    progress: BoardProgress,
) => {
    return write(keyFor(classId, "progress", layout), progress)
}

export const readBoardUndo = (classId: string, layout: BoardId) => {
    return read(keyFor(classId, "board-undo", layout), isBoardUndo)
}

export const writeBoardUndo = (
    classId: string,
    layout: BoardId,
    undo: BoardUndo,
) => {
    return write(keyFor(classId, "board-undo", layout), undo)
}

export const clearBoardUndo = (classId: string, layout: BoardId) => {
    return remove(keyFor(classId, "board-undo", layout))
}

export const readPlannerUndo = (classId: string, layout: BoardId) => {
    return read(keyFor(classId, "planner-undo", layout), isPlannerUndo)
}

export const writePlannerUndo = (
    classId: string,
    layout: BoardId,
    undo: PlannerUndo,
) => {
    return write(keyFor(classId, "planner-undo", layout), undo)
}

export type BoardWantChoices = Record<string, "need" | "prefer" | "skip">

const isWantChoices = (value: unknown): value is BoardWantChoices => {
    return (
        isRecord(value) &&
        Object.values(value).every(
            (want) => want === "need" || want === "prefer" || want === "skip",
        )
    )
}

export const readWantChoices = (classId: string, layout: BoardId) => {
    return read(keyFor(classId, "wants", layout), isWantChoices)
}

export const writeWantChoices = (
    classId: string,
    layout: BoardId,
    choices: BoardWantChoices,
) => {
    return write(keyFor(classId, "wants", layout), choices)
}

export const clearPlannerUndo = (classId: string, layout: BoardId) => {
    return remove(keyFor(classId, "planner-undo", layout))
}

export const readSavedBoards = (classId: string, layout: BoardId) => {
    return read(
        keyFor(classId, "saved-boards", layout),
        (value): value is SavedBoard[] =>
            Array.isArray(value) && value.every(isSavedBoard),
    )
}

export const writeSavedBoards = (
    classId: string,
    layout: BoardId,
    saved: SavedBoard[],
) => {
    if (saved.length > 0) {
        requestPersistentStorage()
    }

    return write(keyFor(classId, "saved-boards", layout), saved)
}

export const readSavedPlanners = (classId: string, layout: BoardId) => {
    return read(
        keyFor(classId, "saved-planners", layout),
        (value): value is SavedPlanner[] =>
            Array.isArray(value) && value.every(isSavedPlanner),
    )
}

export const writeSavedPlanners = (
    classId: string,
    layout: BoardId,
    saved: SavedPlanner[],
) => {
    if (saved.length > 0) {
        requestPersistentStorage()
    }

    return write(keyFor(classId, "saved-planners", layout), saved)
}

export const readPlannerHistory = (classId: string, layout: BoardId) => {
    return read(
        keyFor(classId, "planner-history", layout),
        (value): value is SavedPlanner[] =>
            Array.isArray(value) && value.every(isSavedPlanner),
    )
}

export const writePlannerHistory = (
    classId: string,
    layout: BoardId,
    history: SavedPlanner[],
) => {
    return write(
        keyFor(classId, "planner-history", layout),
        history.slice(0, MAX_PLANNER_HISTORY),
    )
}

// Also moves the rest of its "Optimize all boards" run (same name and time).
export const keepHistoryRun = (
    classId: string,
    layout: BoardId,
    id: string,
    name: string,
): { boards: BoardId[] } | { error: string } => {
    const history = readPlannerHistory(classId, layout)
    const entry = history.value?.find((candidate) => candidate.id === id)
    if (history.error || !entry) {
        return {
            error: history.error ?? "That history entry no longer exists.",
        }
    }

    const boards: BoardId[] = []
    for (const board of BOARD_IDS) {
        const boardHistory =
            board === layout ? history : readPlannerHistory(classId, board)
        const match = boardHistory.value?.find((candidate) =>
            board === layout
                ? candidate.id === id
                : candidate.createdAt === entry.createdAt &&
                  candidate.name === entry.name,
        )
        if (!match) {
            continue
        }

        const saved = readSavedPlanners(classId, board)
        const progress = readBoardProgress(classId, board)
        const readError = saved.error ?? progress.error
        if (readError) {
            return { error: readError }
        }

        const kept: SavedPlanner = { ...match, name: name }
        const active = progress.value?.activePlanner
        const writeError =
            writeSavedPlanners(classId, board, [
                kept,
                ...(saved.value ?? []),
            ]) ??
            writePlannerHistory(
                classId,
                board,
                (boardHistory.value ?? []).filter(
                    (candidate) => candidate.id !== match.id,
                ),
            ) ??
            (progress.value &&
            active?.source === "history" &&
            active.id === match.id
                ? writeBoardProgress(classId, board, {
                      ...progress.value,
                      activePlanner: {
                          id: kept.id,
                          name: name,
                          source: "saved",
                      },
                  })
                : null)
        if (writeError) {
            return { error: writeError }
        }

        boards.push(board)
    }

    return { boards: boards }
}

// Empty plannerId clears the route (with an undo); "current" changes nothing.
export const applyPlannerToBoard = (
    classId: string,
    layout: BoardId,
    plannerId: string,
): string | null => {
    if (plannerId === "current") {
        return null
    }

    const progress = readBoardProgress(classId, layout)
    if (progress.error) {
        return progress.error
    }

    if (!plannerId) {
        const current = progress.value
        if (
            !current ||
            (current.targetCells.length === 0 && current.plannedCost === null)
        ) {
            return null
        }

        return (
            writePlannerUndo(classId, layout, {
                targetCells: current.targetCells,
                plannedPath: current.plannedPath,
                plannedCost: current.plannedCost,
            }) ??
            writeBoardProgress(classId, layout, {
                ...current,
                targetCells: [],
                plannedPath: [],
                plannedCost: null,
                activePlanner: null,
            })
        )
    }

    const source = plannerId.startsWith("saved:") ? "saved" : "history"
    const entries =
        source === "saved"
            ? readSavedPlanners(classId, layout)
            : readPlannerHistory(classId, layout)
    if (entries.error) {
        return entries.error
    }

    const id = plannerId.slice(source.length + 1)
    const entry = entries.value?.find((candidate) => candidate.id === id)
    if (!entry) {
        return "That route no longer exists."
    }

    return writeBoardProgress(classId, layout, {
        selectedCells: progress.value?.selectedCells ?? [],
        availablePoints: entry.availablePoints,
        targetCells: entry.targetCells,
        plannedPath: entry.plannedPath,
        plannedCost: entry.plannedCost,
        activePlanner: { id: entry.id, name: entry.name, source: source },
    })
}
