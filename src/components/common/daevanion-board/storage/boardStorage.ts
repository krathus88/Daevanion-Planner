import { layouts, type BoardLayoutName } from "../config/layouts"

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
    selectedPlannerIds: Partial<Record<BoardLayoutName, string>>
}

type StorageRead<T> = {
    value: T | null
    error: string | null
}

const MAX_PLANNER_HISTORY = 25
const ACTIVE_CLASS_ID = "default"
const STORAGE_VERSION = "v1"
const STORAGE_CHANGE_EVENT = "daevanion-storage-change"
const PLANS_REPLACED_EVENT = "daevanion-plans-replaced"
const SHARED_ALLOCATION_KEY = `daevanion:${STORAGE_VERSION}:${ACTIVE_CLASS_ID}:shared-allocation`

const keyFor = (
    kind:
        | "progress"
        | "board-undo"
        | "planner-undo"
        | "saved-boards"
        | "saved-planners"
        | "planner-history",
    layout: BoardLayoutName,
) => `daevanion:${STORAGE_VERSION}:${ACTIVE_CLASS_ID}:${layout}:${kind}`

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

        return { value, error: null }
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
            new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key } }),
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

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === "string")

const isNonNegativeNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value) && value >= 0

const isNullableNumber = (value: unknown): value is number | null =>
    value === null || (typeof value === "number" && Number.isFinite(value))

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

const isActivePlanner = (value: unknown): value is ActivePlanner =>
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.source === "saved" || value.source === "history")

const isBoardProgress = (value: unknown): value is BoardProgress =>
    isRecord(value) &&
    isStringArray(value.selectedCells) &&
    isNonNegativeNumber(value.availablePoints) &&
    isStringArray(value.targetCells) &&
    isStringArray(value.plannedPath) &&
    isNullableNumber(value.plannedCost) &&
    (value.activePlanner === undefined ||
        value.activePlanner === null ||
        isActivePlanner(value.activePlanner))

const isBoardUndo = (value: unknown): value is BoardUndo =>
    isRecord(value) && isStringArray(value.selectedCells)

const isPlannerUndo = (value: unknown): value is PlannerUndo =>
    isRecord(value) &&
    isStringArray(value.targetCells) &&
    isStringArray(value.plannedPath) &&
    isNullableNumber(value.plannedCost)

const isSavedBoard = (value: unknown): value is SavedBoard =>
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.createdAt === "number" &&
    isNonNegativeNumber(value.availablePoints) &&
    isStringArray(value.selectedCells)

const isSavedPlanner = (value: unknown): value is SavedPlanner =>
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.createdAt === "number" &&
    isNonNegativeNumber(value.availablePoints) &&
    isStringArray(value.targetCells) &&
    isStringArray(value.plannedPath) &&
    isNullableNumber(value.plannedCost)

const isSharedAllocation = (value: unknown): value is SharedAllocation =>
    isRecord(value) &&
    isNonNegativeNumber(value.totalPoints) &&
    isRecord(value.selectedPlannerIds) &&
    Object.entries(value.selectedPlannerIds).every(
        ([layout, id]) =>
            Object.hasOwn(layouts, layout) && typeof id === "string",
    )

export const readSharedAllocation = () =>
    read(SHARED_ALLOCATION_KEY, isSharedAllocation)

export const writeSharedAllocation = (allocation: SharedAllocation) =>
    write(SHARED_ALLOCATION_KEY, allocation)

export const DEFAULT_TOTAL_POINTS = 390

// The one point budget shared by every board.
export const readSharedTotalPoints = () =>
    readSharedAllocation().value?.totalPoints ?? DEFAULT_TOTAL_POINTS

export const writeSharedTotalPoints = (totalPoints: number) =>
    writeSharedAllocation({
        selectedPlannerIds: {},
        ...readSharedAllocation().value,
        totalPoints,
    })

// Points the other boards' current planner routes already use.
export const readRouteCostOfOtherBoards = (layout: BoardLayoutName) =>
    (Object.keys(layouts) as BoardLayoutName[])
        .filter((other) => other !== layout)
        .reduce(
            (total, other) =>
                total + (readBoardProgress(other).value?.plannedCost ?? 0),
            0,
        )

export const subscribeToBoardStorage = (onChange: () => void) => {
    const handleLocalChange = () => onChange()
    const handleStorageChange = (event: StorageEvent) => {
        if (
            event.key === null ||
            event.key.startsWith(
                `daevanion:${STORAGE_VERSION}:${ACTIVE_CLASS_ID}:`,
            )
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

// Fired when plans are written for boards from outside the board's own
// state (e.g. the all-board optimizer), so a mounted board can reload them.
// Lists the boards whose plans changed; omitted means every board.
export const notifyPlansReplaced = (layouts?: BoardLayoutName[]) =>
    window.dispatchEvent(
        new CustomEvent<BoardLayoutName[] | undefined>(PLANS_REPLACED_EVENT, {
            detail: layouts,
        }),
    )

export const subscribeToPlansReplaced = (
    onReplaced: (layouts: BoardLayoutName[] | undefined) => void,
) => {
    const handle = (event: Event) =>
        onReplaced((event as CustomEvent<BoardLayoutName[] | undefined>).detail)
    window.addEventListener(PLANS_REPLACED_EVENT, handle)
    return () => window.removeEventListener(PLANS_REPLACED_EVENT, handle)
}

export const readBoardProgress = (layout: BoardLayoutName) =>
    read(keyFor("progress", layout), isBoardProgress)

export const writeBoardProgress = (
    layout: BoardLayoutName,
    progress: BoardProgress,
) => write(keyFor("progress", layout), progress)

export const readBoardUndo = (layout: BoardLayoutName) =>
    read(keyFor("board-undo", layout), isBoardUndo)

export const writeBoardUndo = (layout: BoardLayoutName, undo: BoardUndo) =>
    write(keyFor("board-undo", layout), undo)

export const clearBoardUndo = (layout: BoardLayoutName) =>
    remove(keyFor("board-undo", layout))

export const readPlannerUndo = (layout: BoardLayoutName) =>
    read(keyFor("planner-undo", layout), isPlannerUndo)

export const writePlannerUndo = (layout: BoardLayoutName, undo: PlannerUndo) =>
    write(keyFor("planner-undo", layout), undo)

export const clearPlannerUndo = (layout: BoardLayoutName) =>
    remove(keyFor("planner-undo", layout))

export const readSavedBoards = (layout: BoardLayoutName) =>
    read(
        keyFor("saved-boards", layout),
        (value): value is SavedBoard[] =>
            Array.isArray(value) && value.every(isSavedBoard),
    )

export const writeSavedBoards = (
    layout: BoardLayoutName,
    saved: SavedBoard[],
) => write(keyFor("saved-boards", layout), saved)

export const readSavedPlanners = (layout: BoardLayoutName) =>
    read(
        keyFor("saved-planners", layout),
        (value): value is SavedPlanner[] =>
            Array.isArray(value) && value.every(isSavedPlanner),
    )

export const writeSavedPlanners = (
    layout: BoardLayoutName,
    saved: SavedPlanner[],
) => write(keyFor("saved-planners", layout), saved)

export const readPlannerHistory = (layout: BoardLayoutName) =>
    read(
        keyFor("planner-history", layout),
        (value): value is SavedPlanner[] =>
            Array.isArray(value) && value.every(isSavedPlanner),
    )

export const writePlannerHistory = (
    layout: BoardLayoutName,
    history: SavedPlanner[],
) =>
    write(
        keyFor("planner-history", layout),
        history.slice(0, MAX_PLANNER_HISTORY),
    )

// Makes a saved or history planner the board's current route, or clears the
// route when plannerId is empty (keeping an undo, like "Clear planner").
// "current" leaves the board unchanged. Returns an error message or null.
export const applyPlannerToBoard = (
    layout: BoardLayoutName,
    plannerId: string,
): string | null => {
    if (plannerId === "current") {
        return null
    }

    const progress = readBoardProgress(layout)
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
            writePlannerUndo(layout, {
                targetCells: current.targetCells,
                plannedPath: current.plannedPath,
                plannedCost: current.plannedCost,
            }) ??
            writeBoardProgress(layout, {
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
            ? readSavedPlanners(layout)
            : readPlannerHistory(layout)
    if (entries.error) {
        return entries.error
    }

    const id = plannerId.slice(source.length + 1)
    const entry = entries.value?.find((candidate) => candidate.id === id)
    if (!entry) {
        return "That route no longer exists."
    }

    return writeBoardProgress(layout, {
        selectedCells: progress.value?.selectedCells ?? [],
        availablePoints: entry.availablePoints,
        targetCells: entry.targetCells,
        plannedPath: entry.plannedPath,
        plannedCost: entry.plannedCost,
        activePlanner: { id: entry.id, name: entry.name, source },
    })
}
