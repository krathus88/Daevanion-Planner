// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { readSyncMeta } from "@account/sync/syncMeta"
import {
    applyPlannerToBoard,
    DEFAULT_TOTAL_POINTS,
    keepHistoryRun,
    MAX_PLANNER_HISTORY,
    readBoardProgress,
    readPlannedCells,
    readPlannerHistory,
    readPlannerUndo,
    readRouteCostOfOtherBoards,
    readSavedPlanners,
    readSharedAllocation,
    readSharedTotalPoints,
    readWantChoices,
    subscribeToBoardStorage,
    subscribeToPlansReplaced,
    notifyPlansReplaced,
    writeBoardProgress,
    writePlannerHistory,
    writeSavedPlanners,
    writeSharedAllocation,
    writeSharedTotalPoints,
    writeWantChoices,
    type BoardProgress,
    type SavedPlanner,
} from "./boardStorage"

const CLASS = "gladiator"

const progress = (overrides: Partial<BoardProgress> = {}): BoardProgress => {
    return {
        selectedCells: [],
        availablePoints: 50,
        targetCells: [],
        plannedPath: [],
        plannedCost: null,
        ...overrides,
    }
}

const planner = (id: string, overrides: Partial<SavedPlanner> = {}) => {
    return {
        id: id,
        name: id,
        createdAt: 1,
        availablePoints: 50,
        targetCells: ["0,0"],
        plannedPath: ["0,0"],
        plannedCost: 4,
        ...overrides,
    }
}

afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
})

describe("board progress", () => {
    it("is empty with nothing saved", () => {
        expect(readBoardProgress(CLASS, "nezekan")).toEqual({
            value: null,
            error: null,
        })
    })

    it("round-trips per class and board", () => {
        const saved = progress({ selectedCells: ["0,1"] })

        expect(writeBoardProgress(CLASS, "nezekan", saved)).toBeNull()
        expect(readBoardProgress(CLASS, "nezekan").value).toEqual(saved)
        expect(readBoardProgress(CLASS, "zikel").value).toBeNull()
        expect(readBoardProgress("cleric", "nezekan").value).toBeNull()
    })

    it.each([
        ["bad JSON", "{"],
        ["the wrong shape", '{"selectedCells":"x"}'],
        ["negative points", JSON.stringify(progress({ availablePoints: -1 }))],
        [
            "a bad active planner",
            JSON.stringify({ ...progress(), activePlanner: { id: 1 } }),
        ],
    ])("reports %s as an error", (_name, raw) => {
        localStorage.setItem(`daevanion:v1:${CLASS}:nezekan:progress`, raw)

        const result = readBoardProgress(CLASS, "nezekan")

        expect(result.value).toBeNull()
        expect(result.error).toBeTruthy()
    })

    it("returns save failures as text", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("quota")
        })

        expect(writeBoardProgress(CLASS, "nezekan", progress())).toBe(
            "Could not save board data: quota",
        )
    })

    it("queues progress for sync", () => {
        writeBoardProgress(CLASS, "nezekan", progress())

        expect(readSyncMeta().pending).toEqual([
            `daevanion:v1:${CLASS}:nezekan:progress`,
        ])
    })
})

describe("readPlannedCells", () => {
    it("reads the route or the manual picks by view", () => {
        writeBoardProgress(
            CLASS,
            "nezekan",
            progress({ selectedCells: ["1,1"], plannedPath: ["2,2"] }),
        )

        expect([...readPlannedCells(CLASS, "nezekan", "planner")]).toEqual([
            "2,2",
        ])
        expect([...readPlannedCells(CLASS, "nezekan", "board")]).toEqual([
            "1,1",
        ])
    })

    it("is empty with nothing saved", () => {
        expect(readPlannedCells(CLASS, "nezekan", "planner").size).toBe(0)
    })
})

describe("shared allocation", () => {
    it("defaults the total", () => {
        expect(readSharedTotalPoints(CLASS)).toBe(DEFAULT_TOTAL_POINTS)
    })

    it("changing the total keeps the chosen routes", () => {
        writeSharedAllocation(CLASS, {
            totalPoints: 10,
            selectedPlannerIds: { zikel: "a" },
        })
        writeSharedTotalPoints(CLASS, 99)

        expect(readSharedAllocation(CLASS).value).toEqual({
            totalPoints: 99,
            selectedPlannerIds: { zikel: "a" },
        })
    })

    it("rejects a route on a board that doesn't exist", () => {
        localStorage.setItem(
            `daevanion:v1:${CLASS}:shared-allocation`,
            '{"totalPoints":1,"selectedPlannerIds":{"azphel":"a"}}',
        )

        expect(readSharedAllocation(CLASS).error).toBeTruthy()
        expect(readSharedTotalPoints(CLASS)).toBe(DEFAULT_TOTAL_POINTS)
    })
})

describe("readRouteCostOfOtherBoards", () => {
    it("adds the other main boards' routes", () => {
        writeBoardProgress(CLASS, "nezekan", progress({ plannedCost: 5 }))
        writeBoardProgress(CLASS, "zikel", progress({ plannedCost: 7 }))
        writeBoardProgress(CLASS, "vaizel", progress({ plannedCost: 11 }))
        writeBoardProgress(CLASS, "ariel", progress({ plannedCost: 100 }))

        expect(readRouteCostOfOtherBoards(CLASS, "nezekan")).toBe(18)
    })
})

describe("want choices", () => {
    it("round-trips", () => {
        writeWantChoices(CLASS, "zikel", { a: "need", b: "skip" })

        expect(readWantChoices(CLASS, "zikel").value).toEqual({
            a: "need",
            b: "skip",
        })
    })

    it("rejects unknown wants", () => {
        localStorage.setItem(
            `daevanion:v1:${CLASS}:zikel:wants`,
            '{"a":"maybe"}',
        )

        expect(readWantChoices(CLASS, "zikel").error).toBeTruthy()
    })
})

describe("planner history", () => {
    it("caps what it saves", () => {
        const history = Array.from(
            { length: MAX_PLANNER_HISTORY + 3 },
            (_, index) => planner(`${index}`),
        )

        writePlannerHistory(CLASS, "nezekan", history)

        const saved = readPlannerHistory(CLASS, "nezekan").value

        expect(saved).toHaveLength(MAX_PLANNER_HISTORY)
        expect(saved?.[0].id).toBe("0")
    })
})

describe("keepHistoryRun", () => {
    it("moves the entry to saved under its new name", () => {
        writePlannerHistory(CLASS, "nezekan", [planner("a")])

        expect(keepHistoryRun(CLASS, "nezekan", "a", "Kept")).toEqual({
            boards: ["nezekan"],
        })
        expect(readPlannerHistory(CLASS, "nezekan").value).toEqual([])
        expect(readSavedPlanners(CLASS, "nezekan").value?.[0]).toMatchObject({
            id: "a",
            name: "Kept",
        })
    })

    it("moves the rest of an optimize-all run with it", () => {
        const run = { name: "Run", createdAt: 7 }

        writePlannerHistory(CLASS, "nezekan", [planner("a", run)])
        writePlannerHistory(CLASS, "zikel", [planner("b", run)])
        writePlannerHistory(CLASS, "vaizel", [
            planner("c", { name: "Other", createdAt: 7 }),
        ])

        expect(keepHistoryRun(CLASS, "nezekan", "a", "Kept")).toEqual({
            boards: ["nezekan", "zikel"],
        })
        expect(readPlannerHistory(CLASS, "vaizel").value).toHaveLength(1)
    })

    it("points an active history route at its saved copy", () => {
        writePlannerHistory(CLASS, "nezekan", [planner("a")])
        writeBoardProgress(
            CLASS,
            "nezekan",
            progress({
                activePlanner: { id: "a", name: "a", source: "history" },
            }),
        )

        keepHistoryRun(CLASS, "nezekan", "a", "Kept")

        expect(
            readBoardProgress(CLASS, "nezekan").value?.activePlanner,
        ).toEqual({ id: "a", name: "Kept", source: "saved" })
    })

    it("reports an entry that's gone", () => {
        expect(keepHistoryRun(CLASS, "nezekan", "gone", "Kept")).toEqual({
            error: "That history entry no longer exists.",
        })
    })
})

describe("applyPlannerToBoard", () => {
    it("changes nothing for the current plan", () => {
        expect(applyPlannerToBoard(CLASS, "nezekan", "current")).toBeNull()
        expect(readBoardProgress(CLASS, "nezekan").value).toBeNull()
    })

    it("loads a saved route and keeps the manual picks", () => {
        writeSavedPlanners(CLASS, "nezekan", [planner("a")])
        writeBoardProgress(
            CLASS,
            "nezekan",
            progress({ selectedCells: ["9,9"] }),
        )

        expect(applyPlannerToBoard(CLASS, "nezekan", "saved:a")).toBeNull()
        expect(readBoardProgress(CLASS, "nezekan").value).toMatchObject({
            selectedCells: ["9,9"],
            plannedCost: 4,
            activePlanner: { id: "a", source: "saved" },
        })
    })

    it("loads a history route", () => {
        writePlannerHistory(CLASS, "nezekan", [planner("a")])

        applyPlannerToBoard(CLASS, "nezekan", "history:a")

        expect(
            readBoardProgress(CLASS, "nezekan").value?.activePlanner?.source,
        ).toBe("history")
    })

    it("reports a route that's gone", () => {
        expect(applyPlannerToBoard(CLASS, "nezekan", "saved:gone")).toBe(
            "That route no longer exists.",
        )
    })

    it("clears the route and leaves an undo", () => {
        writeBoardProgress(
            CLASS,
            "nezekan",
            progress({
                targetCells: ["0,0"],
                plannedPath: ["0,0"],
                plannedCost: 4,
            }),
        )

        expect(applyPlannerToBoard(CLASS, "nezekan", "")).toBeNull()
        expect(readBoardProgress(CLASS, "nezekan").value).toMatchObject({
            targetCells: [],
            plannedPath: [],
            plannedCost: null,
            activePlanner: null,
        })
        expect(readPlannerUndo(CLASS, "nezekan").value).toEqual({
            targetCells: ["0,0"],
            plannedPath: ["0,0"],
            plannedCost: 4,
        })
    })

    it("leaves no undo when there's no route to clear", () => {
        writeBoardProgress(CLASS, "nezekan", progress())

        applyPlannerToBoard(CLASS, "nezekan", "")

        expect(readPlannerUndo(CLASS, "nezekan").value).toBeNull()
    })
})

describe("subscriptions", () => {
    it("hears local saves and planner saves from other tabs", () => {
        const listener = vi.fn()
        const unsubscribe = subscribeToBoardStorage(listener)

        writeBoardProgress(CLASS, "nezekan", progress())
        window.dispatchEvent(
            new StorageEvent("storage", { key: "daevanion:v1:x" }),
        )
        window.dispatchEvent(new StorageEvent("storage", { key: "other" }))
        unsubscribe()
        writeBoardProgress(CLASS, "zikel", progress())

        expect(listener).toHaveBeenCalledTimes(2)
    })

    it("passes on which plans were replaced", () => {
        const listener = vi.fn()
        const unsubscribe = subscribeToPlansReplaced(listener)

        notifyPlansReplaced(["zikel"])
        unsubscribe()
        notifyPlansReplaced()

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith(["zikel"])
    })
})
