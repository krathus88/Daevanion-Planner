import { BOARD_IDS, isBoardId, type BoardId } from "@config/boards"
import { classPresets, type ClassId } from "@config/classPresets"
import { layouts } from "@planner/config/layouts"
import {
    readBoardProgress,
    type SavedBoard,
    type SavedPlanner,
} from "@planner/storage/boardStorage"
import {
    readAllClassSettings,
    replaceClassSettings,
} from "@planner/storage/classSettings"
import { isRecord } from "@planner/storage/isRecord"
import { addSavedEntries, newSavedEntries } from "@planner/storage/savedEntries"

// A plan carried in a link: one board or all of a class's boards, with the
// class's optimizer priorities. Bump VERSION when the shape changes, and
// keep reading the older ones.
const VERSION = 1

type SharedRoute = {
    name: string | null
    targetCells: string[]
    plannedPath: string[]
    plannedCost: number | null
    availablePoints: number
}

type SharedSelection = {
    selectedCells: string[]
    availablePoints: number
}

export type SharedBoard = {
    route: SharedRoute | null
    selection: SharedSelection | null
}

export type SharedPlan = {
    classId: ClassId
    boards: Partial<Record<BoardId, SharedBoard>>
    settings: Record<string, unknown> | null
}

// In the link each cell is its index on the board, row by row, which is
// much shorter than "row,column".
const toIndexes = (layout: BoardId, cells: string[]) => {
    const grid = layouts[layout].grid
    const width = grid[0].length
    // The start node is never part of a plan.
    return cells.flatMap((cell) => {
        const [row, column] = cell.split(",").map(Number)
        return grid[row]?.[column] === "S" ? [] : [row * width + column]
    })
}

const toCells = (layout: BoardId, value: unknown) => {
    const grid = layouts[layout].grid
    const width = grid[0].length
    if (!Array.isArray(value)) {
        return null
    }

    const cells: string[] = []
    for (const index of value) {
        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= grid.length * width
        ) {
            return null
        }

        const row = Math.floor(index / width)
        const column = index % width
        const kind = grid[row][column]
        if (kind === "." || kind === "S") {
            return null
        }

        cells.push(`${row},${column}`)
    }

    return cells
}

const isPoints = (value: unknown): value is number => {
    return typeof value === "number" && Number.isInteger(value) && value >= 0
}

// The plan as it is saved on this device now. Empty boards are left out;
// null when there's nothing to share.
export const readSharedPlan = (
    classId: ClassId,
    boards: readonly BoardId[],
): SharedPlan | null => {
    const plan: SharedPlan = { classId: classId, boards: {}, settings: null }

    for (const layout of boards) {
        const progress = readBoardProgress(classId, layout).value
        if (!progress) {
            continue
        }

        const board: SharedBoard = {
            route:
                progress.targetCells.length > 0
                    ? {
                          name: progress.activePlanner?.name ?? null,
                          targetCells: progress.targetCells,
                          plannedPath: progress.plannedPath,
                          plannedCost: progress.plannedCost,
                          availablePoints: progress.availablePoints,
                      }
                    : null,
            selection:
                progress.selectedCells.length > 0
                    ? {
                          selectedCells: progress.selectedCells,
                          availablePoints: progress.availablePoints,
                      }
                    : null,
        }
        if (board.route || board.selection) {
            plan.boards[layout] = board
        }
    }

    if (Object.keys(plan.boards).length === 0) {
        return null
    }

    try {
        const settings = readAllClassSettings(classId)
        plan.settings = Object.keys(settings).length > 0 ? settings : null
    } catch {
        // Unreadable priorities are left out; the boards still share.
    }

    return plan
}

// Just the class's optimizer settings, with no routes, picks or points.
// Null when they were never changed from the defaults.
export const readSharedSettings = (classId: ClassId): SharedPlan | null => {
    const settings = readAllClassSettings(classId)

    return Object.keys(settings).length > 0
        ? { classId: classId, boards: {}, settings: settings }
        : null
}

// The name a shared plan is saved under unless the viewer types another:
// the sharer's first route name.
export const defaultSharedName = (plan: SharedPlan) => {
    const named = BOARD_IDS.map((id) => plan.boards[id]?.route?.name).find(
        Boolean,
    )

    return named ?? "Shared plan"
}

const toBase64Url = (bytes: Uint8Array) => {
    let binary = ""
    for (const byte of bytes) {
        binary += String.fromCharCode(byte)
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}

const fromBase64Url = (code: string) => {
    const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/"))
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

// The browser's own deflate keeps links short without a library.
const transform = async (
    bytes: Uint8Array<ArrayBuffer>,
    stream: CompressionStream | DecompressionStream,
) => {
    const output = new Blob([bytes]).stream().pipeThrough(stream)
    return new Uint8Array(await new Response(output).arrayBuffer())
}

export const encodeSharedPlan = async (plan: SharedPlan) => {
    const payload = {
        v: VERSION,
        c: plan.classId,
        b: Object.fromEntries(
            Object.entries(plan.boards).map(([layout, board]) => {
                const id = layout as BoardId
                return [
                    id,
                    {
                        ...(board.route && {
                            r: [
                                toIndexes(id, board.route.targetCells),
                                toIndexes(id, board.route.plannedPath),
                                board.route.plannedCost,
                                board.route.availablePoints,
                                board.route.name,
                            ],
                        }),
                        ...(board.selection && {
                            m: [
                                toIndexes(id, board.selection.selectedCells),
                                board.selection.availablePoints,
                            ],
                        }),
                    },
                ]
            }),
        ),
        ...(plan.settings && { s: plan.settings }),
    }
    const json = new TextEncoder().encode(JSON.stringify(payload))

    return toBase64Url(
        await transform(json, new CompressionStream("deflate-raw")),
    )
}

const BROKEN = "This share link is broken or incomplete. Ask for a new one."

const decodeRoute = (layout: BoardId, value: unknown): SharedRoute | null => {
    if (!Array.isArray(value)) {
        return null
    }

    const [targets, path, cost, points, name] = value
    const targetCells = toCells(layout, targets)
    const plannedPath = toCells(layout, path)
    if (
        !targetCells ||
        !plannedPath ||
        !(cost === null || isPoints(cost)) ||
        !isPoints(points) ||
        !(name === null || typeof name === "string")
    ) {
        return null
    }

    return {
        name: name,
        targetCells: targetCells,
        plannedPath: plannedPath,
        plannedCost: cost,
        availablePoints: points,
    }
}

const decodeSelection = (
    layout: BoardId,
    value: unknown,
): SharedSelection | null => {
    if (!Array.isArray(value)) {
        return null
    }

    const [cells, points] = value
    const selectedCells = toCells(layout, cells)
    if (!selectedCells || !isPoints(points)) {
        return null
    }

    return { selectedCells: selectedCells, availablePoints: points }
}

// Reads a link's plan for the class in its URL. Returns an error message
// for a broken, edited or newer link.
export const decodeSharedPlan = async (
    code: string,
    classId: ClassId,
): Promise<SharedPlan | string> => {
    let payload: unknown
    try {
        const bytes = await transform(
            fromBase64Url(code),
            new DecompressionStream("deflate-raw"),
        )
        payload = JSON.parse(new TextDecoder().decode(bytes))
    } catch {
        return BROKEN
    }

    if (!isRecord(payload) || typeof payload.v !== "number") {
        return BROKEN
    }

    if (payload.v > VERSION) {
        return "This link was made by a newer version of the site. Reload the page to update, then open it again."
    }

    if (payload.c !== classId || !isRecord(payload.b)) {
        return BROKEN
    }

    if (payload.s !== undefined && !isRecord(payload.s)) {
        return BROKEN
    }

    const plan: SharedPlan = {
        classId: classId,
        boards: {},
        settings: payload.s ?? null,
    }
    for (const [layout, value] of Object.entries(payload.b)) {
        if (!isBoardId(layout) || !isRecord(value)) {
            return BROKEN
        }

        const route =
            value.r === undefined ? null : decodeRoute(layout, value.r)
        const selection =
            value.m === undefined ? null : decodeSelection(layout, value.m)
        if (
            (value.r !== undefined && !route) ||
            (value.m !== undefined && !selection) ||
            (!route && !selection)
        ) {
            return BROKEN
        }

        plan.boards[layout] = { route: route, selection: selection }
    }

    // A settings-only link has no boards.
    if (Object.keys(plan.boards).length === 0 && !plan.settings) {
        return BROKEN
    }

    return plan
}

// Replaces the viewer's optimizer settings with the link's. Returns an
// error or null.
export const applySharedSettings = (plan: SharedPlan) => {
    if (!plan.settings) {
        return "This link has no optimizer settings."
    }

    try {
        replaceClassSettings(plan.classId, plan.settings)
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save the settings: ${error.message}`
            : "Could not save the settings."
    }
}

// Adds the link's routes and picks to the viewer's saved lists, each named
// `name`, and optionally replaces their priorities with the link's. Entries
// they already have are skipped. Returns a summary or an error.
export const saveSharedPlan = (
    plan: SharedPlan,
    name: string,
    includeSettings: boolean,
): { summary: string } | { error: string } => {
    const now = Date.now()
    let routeCount = 0
    let boardCount = 0

    try {
        for (const layout of BOARD_IDS) {
            const board = plan.boards[layout]
            if (!board) {
                continue
            }

            const planners: SavedPlanner[] = board.route
                ? [
                      {
                          id: crypto.randomUUID(),
                          name: name,
                          createdAt: now,
                          availablePoints: board.route.availablePoints,
                          targetCells: board.route.targetCells,
                          plannedPath: board.route.plannedPath,
                          plannedCost: board.route.plannedCost,
                      },
                  ]
                : []
            const boards: SavedBoard[] = board.selection
                ? [
                      {
                          id: crypto.randomUUID(),
                          name: name,
                          createdAt: now,
                          availablePoints: board.selection.availablePoints,
                          selectedCells: board.selection.selectedCells,
                      },
                  ]
                : []
            const fresh = newSavedEntries(
                plan.classId,
                layout,
                planners,
                boards,
            )
            const error = addSavedEntries(
                plan.classId,
                layout,
                fresh.planners,
                fresh.boards,
            )
            if (error) {
                return { error: error }
            }

            routeCount += fresh.planners.length
            boardCount += fresh.boards.length
        }

        if (includeSettings && plan.settings) {
            replaceClassSettings(plan.classId, plan.settings)
        }
    } catch (error) {
        return {
            error:
                error instanceof Error && error.message
                    ? `Could not save: ${error.message}`
                    : "Could not save.",
        }
    }

    const className = classPresets[plan.classId].name
    const added = [
        routeCount > 0 &&
            `${routeCount} ${routeCount === 1 ? "route" : "routes"}`,
        boardCount > 0 &&
            `${boardCount} manual ${boardCount === 1 ? "board" : "boards"}`,
    ].filter(Boolean)
    const settingsNote =
        includeSettings && plan.settings
            ? " Optimizer priorities replaced."
            : ""

    return {
        summary:
            added.length > 0
                ? `Saved ${added.join(" and ")} to your ${className} plans.${settingsNote}`
                : `You already have everything in this link.${settingsNote}`,
    }
}
