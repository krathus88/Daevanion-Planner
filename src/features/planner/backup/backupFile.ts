import { BOARD_IDS, BOARD_NAMES, isBoardId, type BoardId } from "@config/boards"
import {
    CLASS_IDS,
    CLASS_NAMES,
    isClassId,
    type ClassId,
} from "@config/classPresets"
import {
    isSavedBoard,
    isSavedPlanner,
    readBoardProgress,
    readSavedBoards,
    readSavedPlanners,
    readSharedAllocation,
    writeSharedTotalPoints,
    type SavedBoard,
    type SavedPlanner,
} from "@planner/storage/boardStorage"
import {
    readAllClassSettings,
    replaceClassSettings,
} from "@planner/storage/classSettings"
import { isRecord } from "@planner/storage/isRecord"
import { addSavedEntries, newSavedEntries } from "@planner/storage/savedEntries"

// Bump VERSION when the shape changes, and keep reading older ones.
const FORMAT = "daevanion-planner-backup"
const VERSION = 1

type BackupBoard = {
    savedPlanners: SavedPlanner[]
    savedBoards: SavedBoard[]
}

type BackupClass = {
    settings?: Record<string, unknown>
    totalPoints?: number
    boards: Partial<Record<BoardId, BackupBoard>>
}

type Backup = {
    format: typeof FORMAT
    version: number
    exportedAt: string
    classes: Partial<Record<ClassId, BackupClass>>
}

// Unsaved current routes and picks, so moving device doesn't lose them.
const currentEntries = (classId: ClassId, layout: BoardId) => {
    const progress = readBoardProgress(classId, layout).value
    const now = Date.now()
    const planners: SavedPlanner[] =
        progress &&
        progress.targetCells.length > 0 &&
        progress.activePlanner?.source !== "saved"
            ? [
                  {
                      id: crypto.randomUUID(),
                      name: progress.activePlanner?.name ?? "Current route",
                      createdAt: now,
                      availablePoints: progress.availablePoints,
                      targetCells: progress.targetCells,
                      plannedPath: progress.plannedPath,
                      plannedCost: progress.plannedCost,
                  },
              ]
            : []
    const boards: SavedBoard[] =
        progress && progress.selectedCells.length > 0
            ? [
                  {
                      id: crypto.randomUUID(),
                      name: "Current selection",
                      createdAt: now,
                      availablePoints: progress.availablePoints,
                      selectedCells: progress.selectedCells,
                  },
              ]
            : []

    return { planners: planners, boards: boards }
}

const exportClass = (classId: ClassId) => {
    const exported: BackupClass = { boards: {} }
    let hasData = false
    let skipped = false

    try {
        const settings = readAllClassSettings(classId)
        if (Object.keys(settings).length > 0) {
            exported.settings = settings
            hasData = true
        }
    } catch {
        skipped = true
    }

    const allocation = readSharedAllocation(classId)
    skipped ||= Boolean(allocation.error)
    if (allocation.value) {
        exported.totalPoints = allocation.value.totalPoints
        hasData = true
    }

    for (const layout of BOARD_IDS) {
        const savedPlanners = readSavedPlanners(classId, layout)
        const savedBoards = readSavedBoards(classId, layout)
        skipped ||= Boolean(savedPlanners.error || savedBoards.error)

        const current = currentEntries(classId, layout)
        const board: BackupBoard = {
            // Saved first, so a current plan that matches one keeps its name.
            savedPlanners: [
                ...(savedPlanners.value ?? []),
                ...current.planners,
            ],
            savedBoards: [...(savedBoards.value ?? []), ...current.boards],
        }
        if (board.savedPlanners.length > 0 || board.savedBoards.length > 0) {
            exported.boards[layout] = board
            hasData = true
        }
    }

    return { exported: hasData ? exported : null, skipped: skipped }
}

export const exportBackup = (): { error: string } | { note: string } => {
    const backup: Backup = {
        format: FORMAT,
        version: VERSION,
        exportedAt: new Date().toISOString(),
        classes: {},
    }
    let skipped = false

    for (const classId of CLASS_IDS) {
        const result = exportClass(classId)
        skipped ||= result.skipped
        if (result.exported) {
            backup.classes[classId] = result.exported
        }
    }

    if (Object.keys(backup.classes).length === 0) {
        return { error: "There's nothing saved to back up yet." }
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `daevanion-planner-backup-${backup.exportedAt.slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)

    return {
        note: skipped
            ? "Backup saved. Some saved data couldn't be read and was left out."
            : "Backup saved.",
    }
}

const parseBoard = (value: unknown, where: string): BackupBoard | string => {
    if (
        !isRecord(value) ||
        !Array.isArray(value.savedPlanners) ||
        !Array.isArray(value.savedBoards)
    ) {
        return `${where} is missing its saved lists.`
    }

    if (!value.savedPlanners.every(isSavedPlanner)) {
        return `${where} has an invalid saved route.`
    }

    if (!value.savedBoards.every(isSavedBoard)) {
        return `${where} has an invalid manual board.`
    }

    return {
        savedPlanners: value.savedPlanners,
        savedBoards: value.savedBoards,
    }
}

const parseClass = (classId: ClassId, value: unknown): BackupClass | string => {
    const className = CLASS_NAMES[classId]
    if (!isRecord(value) || !isRecord(value.boards)) {
        return `${className} has no boards.`
    }

    if (value.settings !== undefined && !isRecord(value.settings)) {
        return `${className}'s optimizer priorities are invalid.`
    }

    if (
        value.totalPoints !== undefined &&
        !(
            typeof value.totalPoints === "number" &&
            Number.isInteger(value.totalPoints) &&
            value.totalPoints >= 0
        )
    ) {
        return `${className}'s point budget is invalid.`
    }

    const parsed: BackupClass = {
        settings: value.settings,
        totalPoints: value.totalPoints,
        boards: {},
    }
    for (const [layout, board] of Object.entries(value.boards)) {
        if (!isBoardId(layout)) {
            return `${className} has an unknown board, "${layout}".`
        }

        const parsedBoard = parseBoard(
            board,
            `${className} · ${BOARD_NAMES[layout]}`,
        )
        if (typeof parsedBoard === "string") {
            return parsedBoard
        }

        parsed.boards[layout] = parsedBoard
    }

    return parsed
}

const parseBackup = (text: string): Backup | string => {
    let value: unknown
    try {
        value = JSON.parse(text)
    } catch {
        return "This file isn't a Daevanion Planner backup (it isn't valid JSON)."
    }

    if (!isRecord(value) || value.format !== FORMAT) {
        return "This file isn't a Daevanion Planner backup."
    }

    if (typeof value.version !== "number" || value.version < 1) {
        return "This backup has no valid version and can't be imported."
    }

    if (value.version > VERSION) {
        return `This backup was made by a newer version of the site (version ${value.version}). Reload the page to update, then try again.`
    }

    if (!isRecord(value.classes)) {
        return "This backup has no classes in it."
    }

    const backup: Backup = {
        format: FORMAT,
        version: value.version,
        exportedAt:
            typeof value.exportedAt === "string" ? value.exportedAt : "",
        classes: {},
    }
    for (const [classId, classData] of Object.entries(value.classes)) {
        if (!isClassId(classId)) {
            return `This backup has an unknown class, "${classId}".`
        }

        const parsed = parseClass(classId, classData)
        if (typeof parsed === "string") {
            return `This backup is damaged: ${parsed}`
        }

        backup.classes[classId] = parsed
    }

    return backup
}

type ImportBoard = {
    layout: BoardId
    planners: SavedPlanner[]
    boards: SavedBoard[]
}

type ImportClass = {
    classId: ClassId
    settings?: Record<string, unknown>
    totalPoints?: number
    boards: ImportBoard[]
}

export type ImportPlan = {
    exportedAt: string
    classes: ImportClass[]
    routeCount: number
    boardCount: number
    replacedClasses: ClassId[]
}

const markImported = <T extends { name: string }>(entry: T): T => {
    return { ...entry, name: `${entry.name} (imported)` }
}

export const planImport = (text: string): ImportPlan | string => {
    const backup = parseBackup(text)
    if (typeof backup === "string") {
        return backup
    }

    const classes: ImportClass[] = []
    try {
        for (const classId of CLASS_IDS) {
            const classData = backup.classes[classId]
            if (!classData) {
                continue
            }

            const boards = BOARD_IDS.flatMap((layout) => {
                const board = classData.boards[layout]
                if (!board) {
                    return []
                }

                const fresh = newSavedEntries(
                    classId,
                    layout,
                    board.savedPlanners,
                    board.savedBoards,
                )
                return fresh.planners.length > 0 || fresh.boards.length > 0
                    ? [
                          {
                              layout: layout,
                              planners: fresh.planners.map(markImported),
                              boards: fresh.boards.map(markImported),
                          },
                      ]
                    : []
            })

            classes.push({
                classId: classId,
                settings: classData.settings,
                totalPoints: classData.totalPoints,
                boards: boards,
            })
        }
    } catch (error) {
        return error instanceof Error && error.message
            ? `Could not read your saved data: ${error.message}`
            : "Could not read your saved data."
    }

    const allBoards = classes.flatMap((classData) => classData.boards)

    return {
        exportedAt: backup.exportedAt,
        classes: classes,
        routeCount: allBoards.reduce((sum, b) => sum + b.planners.length, 0),
        boardCount: allBoards.reduce((sum, b) => sum + b.boards.length, 0),
        replacedClasses: classes
            .filter(
                (classData) =>
                    classData.settings !== undefined ||
                    classData.totalPoints !== undefined,
            )
            .map((classData) => classData.classId),
    }
}

// Current boards and optimizer history are left alone.
export const applyImport = (plan: ImportPlan) => {
    try {
        for (const classData of plan.classes) {
            for (const board of classData.boards) {
                const error = addSavedEntries(
                    classData.classId,
                    board.layout,
                    board.planners,
                    board.boards,
                )
                if (error) {
                    return error
                }
            }

            if (classData.settings) {
                replaceClassSettings(classData.classId, classData.settings)
            }

            if (classData.totalPoints !== undefined) {
                const error = writeSharedTotalPoints(
                    classData.classId,
                    classData.totalPoints,
                )
                if (error) {
                    return error
                }
            }
        }
    } catch (error) {
        return error instanceof Error
            ? `Could not import: ${error.message}`
            : "Could not import."
    }

    return null
}
