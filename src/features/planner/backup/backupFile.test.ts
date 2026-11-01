// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import {
    readSavedBoards,
    readSavedPlanners,
    readSharedTotalPoints,
    writeBoardProgress,
    writeSavedPlanners,
    writeSharedTotalPoints,
} from "@planner/storage/boardStorage"
import {
    readAllClassSettings,
    writeClassSettings,
} from "@planner/storage/classSettings"
import {
    applyImport,
    exportBackup,
    planImport,
    type ImportPlan,
} from "./backupFile"

const FORMAT = "daevanion-planner-backup"

const savedPlanner = {
    id: "p1",
    name: "Route",
    createdAt: 1,
    availablePoints: 50,
    targetCells: ["0,0"],
    plannedPath: ["0,0"],
    plannedCost: 4,
}

const savedBoard = {
    id: "b1",
    name: "Board",
    createdAt: 1,
    availablePoints: 50,
    selectedCells: ["0,1"],
}

const backup = (classes: unknown, overrides: object = {}) => {
    return JSON.stringify({
        format: FORMAT,
        version: 1,
        exportedAt: "2026-01-01T00:00:00.000Z",
        classes: classes,
        ...overrides,
    })
}

const gladiator = (data: object) => {
    return backup({ gladiator: { boards: {}, ...data } })
}

// Captures the file exportBackup hands to the browser.
const captureExport = () => {
    let blob: Blob | undefined

    vi.spyOn(URL, "createObjectURL").mockImplementation((value) => {
        blob = value as Blob

        return "blob:test"
    })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})

    return () => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader()

            reader.onload = () => {
                resolve(reader.result as string)
            }
            reader.readAsText(blob as Blob)
        })
    }
}

afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
})

describe("planImport: rejecting files", () => {
    it.each([
        ["not JSON", "{", "isn't valid JSON"],
        [
            "another format",
            '{"format":"x"}',
            "isn't a Daevanion Planner backup",
        ],
        ["no version", JSON.stringify({ format: FORMAT }), "no valid version"],
        [
            "version 0",
            JSON.stringify({ format: FORMAT, version: 0 }),
            "no valid version",
        ],
        ["a newer version", backup({}, { version: 99 }), "newer version"],
        [
            "no classes",
            JSON.stringify({ format: FORMAT, version: 1 }),
            "no classes",
        ],
        ["an unknown class", backup({ nobody: {} }), 'unknown class, "nobody"'],
        ["a class without boards", backup({ gladiator: {} }), "has no boards"],
        [
            "bad settings",
            gladiator({ settings: 5 }),
            "optimizer priorities are invalid",
        ],
        [
            "a bad budget",
            gladiator({ totalPoints: -1 }),
            "point budget is invalid",
        ],
        [
            "an unknown board",
            gladiator({ boards: { azphel: {} } }),
            'unknown board, "azphel"',
        ],
        [
            "a board without lists",
            gladiator({ boards: { nezekan: {} } }),
            "Gladiator · Nezekan is missing",
        ],
        [
            "a bad route",
            gladiator({
                boards: {
                    nezekan: { savedPlanners: [{}], savedBoards: [] },
                },
            }),
            "invalid saved route",
        ],
        [
            "a bad manual board",
            gladiator({
                boards: {
                    nezekan: { savedPlanners: [], savedBoards: [{}] },
                },
            }),
            "invalid manual board",
        ],
    ])("explains %s", (_name, text, message) => {
        expect(planImport(text)).toContain(message)
    })
})

describe("planImport: planning", () => {
    const text = gladiator({
        settings: { stats: 1 },
        totalPoints: 100,
        boards: {
            nezekan: {
                savedPlanners: [savedPlanner],
                savedBoards: [savedBoard],
            },
        },
    })

    it("counts what will be added and replaced", () => {
        const plan = planImport(text) as ImportPlan

        expect(plan.routeCount).toBe(1)
        expect(plan.boardCount).toBe(1)
        expect(plan.replacedClasses).toEqual(["gladiator"])
        expect(plan.exportedAt).toBe("2026-01-01T00:00:00.000Z")
    })

    it("marks entries as imported", () => {
        const plan = planImport(text) as ImportPlan

        expect(plan.classes[0].boards[0].planners[0].name).toBe(
            "Route (imported)",
        )
    })

    it("skips what's already saved", () => {
        writeSavedPlanners("gladiator", "nezekan", [savedPlanner])

        expect((planImport(text) as ImportPlan).routeCount).toBe(0)
    })

    it("reports saved data it can't read", () => {
        localStorage.setItem("daevanion:v1:gladiator:nezekan:saved-boards", "{")

        expect(planImport(text)).toContain("Could not read your saved data")
    })
})

describe("applyImport", () => {
    it("adds entries and replaces settings and budget", () => {
        writeClassSettings("gladiator", "ariel", 9)
        writeSharedTotalPoints("gladiator", 1)

        const plan = planImport(
            gladiator({
                settings: { stats: 1 },
                totalPoints: 100,
                boards: {
                    nezekan: {
                        savedPlanners: [savedPlanner],
                        savedBoards: [savedBoard],
                    },
                },
            }),
        ) as ImportPlan

        expect(applyImport(plan)).toBeNull()
        expect(readSavedPlanners("gladiator", "nezekan").value).toHaveLength(1)
        expect(readSavedBoards("gladiator", "nezekan").value).toHaveLength(1)
        expect(readAllClassSettings("gladiator")).toEqual({ stats: 1 })
        expect(readSharedTotalPoints("gladiator")).toBe(100)
    })

    it("importing twice adds nothing new", () => {
        const text = gladiator({
            boards: {
                nezekan: { savedPlanners: [savedPlanner], savedBoards: [] },
            },
        })

        applyImport(planImport(text) as ImportPlan)
        applyImport(planImport(text) as ImportPlan)

        expect(readSavedPlanners("gladiator", "nezekan").value).toHaveLength(1)
    })

    it("returns save failures as text", () => {
        const plan = planImport(gladiator({ totalPoints: 5 })) as ImportPlan

        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("quota")
        })

        expect(applyImport(plan)).toContain("quota")
    })
})

describe("exportBackup", () => {
    it("says when there's nothing to back up", () => {
        expect(exportBackup()).toEqual({
            error: "There's nothing saved to back up yet.",
        })
    })

    it("writes a file the import can read back", async () => {
        const readFile = captureExport()

        writeSavedPlanners("gladiator", "nezekan", [savedPlanner])
        writeClassSettings("cleric", "stats", 1)

        expect(exportBackup()).toEqual({ note: "Backup saved." })

        const text = await readFile()

        localStorage.clear()

        const plan = planImport(text) as ImportPlan

        expect(plan.routeCount).toBe(1)
        expect(plan.replacedClasses).toEqual(["cleric"])
    })

    it("includes unsaved current routes and picks", async () => {
        const readFile = captureExport()

        writeBoardProgress("gladiator", "nezekan", {
            selectedCells: ["0,1"],
            availablePoints: 50,
            targetCells: ["0,0"],
            plannedPath: ["0,0"],
            plannedCost: 4,
        })
        exportBackup()

        const parsed = JSON.parse(await readFile())
        const board = parsed.classes.gladiator.boards.nezekan

        expect(board.savedPlanners[0].name).toBe("Current route")
        expect(board.savedBoards[0].name).toBe("Current selection")
    })

    it("doesn't repeat a current route that's already saved", async () => {
        const readFile = captureExport()

        writeSavedPlanners("gladiator", "nezekan", [savedPlanner])
        writeBoardProgress("gladiator", "nezekan", {
            selectedCells: [],
            availablePoints: 50,
            targetCells: ["0,0"],
            plannedPath: ["0,0"],
            plannedCost: 4,
            activePlanner: { id: "p1", name: "Route", source: "saved" },
        })
        exportBackup()

        const parsed = JSON.parse(await readFile())

        expect(
            parsed.classes.gladiator.boards.nezekan.savedPlanners,
        ).toHaveLength(1)
    })

    it("warns when something couldn't be read", () => {
        captureExport()
        writeClassSettings("gladiator", "stats", 1)
        localStorage.setItem("daevanion:v1:cleric:nezekan:saved-boards", "{")

        expect(exportBackup()).toEqual({
            note: "Backup saved. Some saved data couldn't be read and was left out.",
        })
    })
})
