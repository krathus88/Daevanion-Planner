import { act, renderHook } from "@testing-library/react"
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest"
import { loadClassPreset, type ClassPreset } from "@config/classPresets"
import type { BoardId } from "@config/boards"
import {
    notifyPlansReplaced,
    readBoardProgress,
    readPlannerHistory,
    readSavedPlanners,
    writeBoardProgress,
    writePlannerHistory,
    type BoardProgress,
    type SavedPlanner,
} from "@planner/storage/boardStorage"
import { makeLayout } from "@test/boardFixture"
import { installFakeWorker, lastWorker } from "@test/fakeWorker"
import { useBoardProgress } from "./useBoardProgress"
import { usePlannerRoute } from "./usePlannerRoute"

const CLASS = "gladiator"
const layout = makeLayout()
const start = { row: 0, column: 0 }

let preset: ClassPreset

beforeAll(async () => {
    preset = await loadClassPreset(CLASS)
})

beforeEach(() => {
    installFakeWorker()
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

const entry = (id: string, overrides: Partial<SavedPlanner> = {}) => {
    return {
        id: id,
        name: id,
        createdAt: 1,
        availablePoints: 50,
        targetCells: ["0,2"],
        plannedPath: ["0,1", "0,2"],
        plannedCost: 4,
        ...overrides,
    }
}

type Options = {
    layoutName?: BoardId
    initial?: BoardProgress | null
    saved?: SavedPlanner[]
    history?: SavedPlanner[]
    needCells?: ReadonlySet<string>
}

const setup = ({
    layoutName = "nezekan",
    initial = null,
    saved = [],
    history = [],
    needCells = new Set<string>(),
}: Options = {}) => {
    const setMessage = vi.fn()
    const setView = vi.fn()
    const excludeStart = (keys: string[]) => {
        return keys.filter((key) => key !== "0,0")
    }
    const hook = renderHook(() => {
        const progress = useBoardProgress({
            classId: CLASS,
            layoutName: layoutName,
            initial: initial,
            availablePoints: 50,
            excludeStart: excludeStart,
            setMessage: setMessage,
        })

        return usePlannerRoute({
            classPreset: preset,
            layoutName: layoutName,
            layout: layout,
            start: start,
            progress: progress,
            needCells: needCells,
            preferred: new Set(),
            availablePoints: 50,
            initialUndo: null,
            initialSaved: saved,
            initialHistory: history,
            excludeStart: excludeStart,
            setMessage: setMessage,
            setView: setView,
        })
    })

    return {
        result: hook.result,
        unmount: hook.unmount,
        setMessage: setMessage,
        setView: setView,
    }
}

const withRoute: BoardProgress = {
    selectedCells: [],
    availablePoints: 50,
    targetCells: ["0,2"],
    plannedPath: ["0,1", "0,2"],
    plannedCost: 4,
}

const candidate = (cost: number, overrides: object = {}) => {
    return {
        type: "candidate",
        result: {
            ok: true,
            path: ["0,1"],
            cost: cost,
            statScore: 0,
            ...overrides,
        },
    }
}

const DONE = { type: "done", result: { ok: true }, elapsedMs: 1500 }

describe("targets", () => {
    it("adds and removes a target, dropping the old route", () => {
        const { result } = setup({ initial: withRoute })

        act(() => {
            result.current.toggleTarget({ row: 1, column: 1 })
        })

        expect([...result.current.targetCells].sort()).toEqual(["0,2", "1,1"])
        expect(result.current.plannedPath.size).toBe(0)
        expect(result.current.plannedCost).toBeNull()

        act(() => {
            result.current.toggleTarget({ row: 1, column: 1 })
        })

        expect([...result.current.targetCells]).toEqual(["0,2"])
    })

    it("won't target the start", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.toggleTarget(start)
        })

        expect(result.current.targetCells.size).toBe(0)
        expect(setMessage).toHaveBeenLastCalledWith(
            "The start node is the route origin, not a target.",
        )
    })

    it("stops a running search", () => {
        const { result } = setup()

        act(() => {
            result.current.optimizePlanner()
        })

        const worker = lastWorker()

        act(() => {
            result.current.toggleTarget({ row: 1, column: 1 })
        })

        expect(worker.terminated).toBe(true)
        expect(result.current.isOptimizing).toBe(false)
    })
})

describe("optimizing", () => {
    it("stops after a minute without a better route by default", () => {
        const { result } = setup()

        act(() => {
            result.current.optimizePlanner()
        })

        expect(lastWorker().posted[0]).toMatchObject({ stallMs: 60_000 })
    })

    it("asks the worker to stop, then keeps what it found", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.optimizePlanner()
        })
        const worker = lastWorker()
        worker.emit({ ...candidate(9), elapsedMs: 300 })

        act(() => {
            result.current.stopOptimization()
        })

        expect(worker.posted.at(-1)).toEqual({ type: "stop" })
        expect(worker.terminated).toBe(false)
        expect(result.current.isStopping).toBe(true)
        expect(result.current.isOptimizing).toBe(true)

        worker.emit({ ...DONE, elapsedMs: 75_000 })

        expect(result.current.isStopping).toBe(false)
        expect(result.current.isOptimizing).toBe(false)
        expect(result.current.plannerHistory).toHaveLength(1)
        expect(setMessage).toHaveBeenLastCalledWith(
            "Best route found after 1m 15s and saved to optimization history.\n\nNo better route turned up after the first at 0.3s.",
        )
    })

    it("sends targets and needed nodes to the worker", () => {
        const { result } = setup({
            initial: withRoute,
            needCells: new Set(["2,2"]),
        })

        act(() => {
            result.current.optimizePlanner(5000)
        })

        expect(result.current.isOptimizing).toBe(true)
        expect(lastWorker().posted[0]).toMatchObject({
            targets: ["0,2", "2,2"],
            type: "start",
            stallMs: 5000,
            availablePoints: 50,
            growStats: false,
        })
    })

    it("grows stats on Ariel", () => {
        const { result } = setup({ layoutName: "ariel" })

        act(() => {
            result.current.optimizePlanner()
        })

        expect(lastWorker().posted[0]).toMatchObject({ growStats: true })
    })

    it("shows each better candidate as it arrives", () => {
        const { result } = setup()

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit(candidate(9))
        expect(result.current.plannedCost).toBe(9)

        lastWorker().emit(candidate(12))
        expect(result.current.plannedCost).toBe(9)

        lastWorker().emit(candidate(7))
        expect(result.current.plannedCost).toBe(7)
    })

    it("counts each better route found after the first", () => {
        const { result } = setup()

        act(() => {
            result.current.optimizePlanner()
        })
        expect(result.current.improvesCurrent).toBe(false)
        expect(result.current.routeFinds.firstFoundMs).toBeNull()

        lastWorker().emit(candidate(9))
        expect(result.current.routeFinds.firstFoundMs).not.toBeNull()
        expect(result.current.routeFinds.improvements).toBe(0)

        lastWorker().emit(candidate(12))
        expect(result.current.routeFinds.improvements).toBe(0)

        lastWorker().emit(candidate(7))
        lastWorker().emit(candidate(5))
        expect(result.current.routeFinds.improvements).toBe(2)
        expect(result.current.routeFinds.lastImprovedMs).not.toBeNull()

        act(() => {
            result.current.cancelOptimization()
        })
        expect(result.current.routeFinds.improvements).toBe(0)
    })

    it("counts the first route that beats the current one on Improve", () => {
        const { result } = setup({ initial: withRoute })

        act(() => {
            result.current.optimizePlanner()
        })
        expect(result.current.improvesCurrent).toBe(true)

        lastWorker().emit(candidate(3))
        expect(result.current.routeFinds.improvements).toBe(1)
    })

    it("always takes a route extended with leftover stats", () => {
        const { result } = setup()

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit(candidate(9))
        lastWorker().emit(candidate(20, { extended: true }))

        expect(result.current.plannedCost).toBe(20)
    })

    it("shows valid progress and ignores the rest", () => {
        const { result } = setup()

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit({
            type: "progress",
            progress: { attempts: 3, elapsedMs: 10, idleMs: 5 },
        })
        expect(result.current.optimizationProgress?.attempts).toBe(3)

        lastWorker().emit({ type: "progress", progress: 5 })
        expect(result.current.optimizationProgress?.attempts).toBe(3)
    })

    it("records a finished run in history and makes it active", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.optimizePlanner()
        })

        const worker = lastWorker()

        worker.emit({ ...candidate(9), elapsedMs: 300 })
        worker.emit(DONE)

        expect(result.current.isOptimizing).toBe(false)
        expect(worker.terminated).toBe(true)
        expect(result.current.plannerHistory).toHaveLength(1)
        expect(result.current.activePlanner?.source).toBe("history")
        expect(readPlannerHistory(CLASS, "nezekan").value).toHaveLength(1)
        expect(readBoardProgress(CLASS, "nezekan").value).toMatchObject({
            plannedCost: 9,
            activePlanner: { source: "history" },
        })
        expect(setMessage).toHaveBeenLastCalledWith(
            "Best route found after 1.5 sec and saved to optimization history.\n\nNo better route turned up after the first at 0.3s.",
        )
    })

    it("says how many better routes it found, and when the last was", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.optimizePlanner()
        })

        const worker = lastWorker()

        worker.emit({ ...candidate(9), elapsedMs: 100 })
        worker.emit({ ...candidate(8), elapsedMs: 400 })
        worker.emit({ ...candidate(7), elapsedMs: 1200 })
        worker.emit(DONE)

        expect(setMessage).toHaveBeenLastCalledWith(
            "Best route found after 1.5 sec and saved to optimization history.\n\nFound 2 better routes after the first, the last at 1.2s.",
        )
    })

    it("counts better routes than the current one on Improve", () => {
        const { result, setMessage } = setup({ initial: withRoute })

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit({ ...candidate(3), elapsedMs: 700 })
        lastWorker().emit(DONE)

        expect(setMessage).toHaveBeenLastCalledWith(
            "Best route found after 1.5 sec and saved to optimization history.\n\nFound 1 better route than the current one, the last at 0.7s.",
        )
    })

    it("words the result differently on Ariel", () => {
        const { result, setMessage } = setup({ layoutName: "ariel" })

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit(candidate(9))
        lastWorker().emit(DONE)

        expect(setMessage).toHaveBeenLastCalledWith(
            "Ariel route built and saved to optimization history.",
        )
    })

    it("keeps the previous route when nothing beats it", () => {
        const { result, setMessage } = setup({ initial: withRoute })

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit(candidate(4))
        lastWorker().emit({
            type: "progress",
            progress: { attempts: 2400, elapsedMs: 1500, idleMs: 900 },
        })
        expect(result.current.routeFinds.optionsChecked).toBe(2400)
        lastWorker().emit(DONE)

        expect(result.current.plannedCost).toBe(4)
        expect(result.current.plannerHistory).toEqual([])
        expect(setMessage).toHaveBeenLastCalledWith(
            "No better route found after 1.5 sec; kept the previous 4-point route.\n\nChecked 2,400 options.",
        )
    })

    it("records a route that costs the same but has better stats", () => {
        const { result, setMessage } = setup({ initial: withRoute })

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit({
            ...candidate(4, {
                path: ["0,2"],
                statScore: Number.MAX_SAFE_INTEGER,
            }),
            elapsedMs: 800,
        })
        lastWorker().emit(DONE)

        expect(result.current.plannerHistory).toHaveLength(1)
        expect(setMessage).toHaveBeenLastCalledWith(
            "Best route found after 1.5 sec and saved to optimization history.\n\nFound 1 better route than the current one, the last at 0.8s.",
        )
    })

    it("replaces a route that misses a newly needed node", () => {
        const { result } = setup({
            initial: withRoute,
            needCells: new Set(["2,2"]),
        })

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit(candidate(30))

        expect(result.current.plannedCost).toBe(30)
    })

    it("passes on why no route was found", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit({
            type: "done",
            result: { ok: false, reason: "No way." },
        })

        expect(setMessage).toHaveBeenLastCalledWith("No way.")
        expect(result.current.isOptimizing).toBe(false)
    })

    it("explains a run that returned nothing", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit(DONE)

        expect(setMessage).toHaveBeenLastCalledWith(
            "The planner finished without returning a route.",
        )
    })

    it("reports worker failures of every kind", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.optimizePlanner()
        })
        lastWorker().emit({ type: "error", message: "Boom" })
        expect(setMessage).toHaveBeenLastCalledWith("Boom")

        act(() => {
            result.current.optimizePlanner()
        })
        act(() => {
            lastWorker().onerror?.({ message: "" })
        })
        expect(setMessage).toHaveBeenLastCalledWith(
            "The route optimization worker failed. Please try again.",
        )
        expect(result.current.isOptimizing).toBe(false)

        act(() => {
            result.current.optimizePlanner()
        })
        act(() => {
            lastWorker().onmessageerror?.()
        })
        expect(setMessage).toHaveBeenLastCalledWith(
            "The route optimizer returned data the page could not read. Please try again.",
        )
    })

    it("reports a worker that can't start", () => {
        vi.stubGlobal(
            "Worker",
            class {
                constructor() {
                    throw new Error("No workers here")
                }
            },
        )

        const { result, setMessage } = setup()

        act(() => {
            result.current.optimizePlanner()
        })

        expect(setMessage).toHaveBeenLastCalledWith("No workers here")
        expect(result.current.isOptimizing).toBe(false)
    })

    it("stops the worker when the board closes", () => {
        const { result, unmount } = setup()

        act(() => {
            result.current.optimizePlanner()
        })
        unmount()

        expect(lastWorker().terminated).toBe(true)
    })

    it("cancels on request", () => {
        const { result } = setup()

        act(() => {
            result.current.optimizePlanner()
        })
        act(() => {
            result.current.cancelOptimization()
        })

        expect(lastWorker().terminated).toBe(true)
        expect(result.current.isOptimizing).toBe(false)
    })
})

describe("clear and restore", () => {
    it("clears the route and brings it back", () => {
        const { result } = setup({ initial: withRoute })

        act(() => {
            result.current.clearPlanner()
        })

        expect(result.current.targetCells.size).toBe(0)
        expect(result.current.plannedCost).toBeNull()
        expect(result.current.plannerUndo?.plannedCost).toBe(4)

        act(() => {
            result.current.restorePlanner()
        })

        expect([...result.current.targetCells]).toEqual(["0,2"])
        expect(result.current.plannedCost).toBe(4)
        expect(result.current.plannerUndo).toBeNull()
    })

    it("does nothing to restore without an undo", () => {
        const { result } = setup()

        act(() => {
            result.current.restorePlanner()
        })

        expect(result.current.targetCells.size).toBe(0)
    })
})

describe("saved routes", () => {
    it("needs a name", () => {
        const { result, setMessage } = setup({ initial: withRoute })

        act(() => {
            result.current.savePlanner()
        })

        expect(setMessage).toHaveBeenLastCalledWith(
            "Enter a name before saving this planner.",
        )
        expect(result.current.savedPlanners).toEqual([])
    })

    it("saves, trims, and makes it active", () => {
        const { result, setMessage } = setup({ initial: withRoute })

        act(() => {
            result.current.setPlannerSaveName("  Mine ")
        })
        act(() => {
            result.current.savePlanner()
        })

        expect(result.current.savedPlanners[0]).toMatchObject({
            name: "Mine",
            plannedCost: 4,
        })
        expect(result.current.activePlanner).toMatchObject({
            name: "Mine",
            source: "saved",
        })
        expect(result.current.plannerSaveName).toBe("")
        expect(setMessage).toHaveBeenLastCalledWith('Saved "Mine".')
        expect(readSavedPlanners(CLASS, "nezekan").value).toHaveLength(1)
    })

    it("loads a route, leaving out the start", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.loadPlanner(
                entry("a", { plannedPath: ["0,0", "0,1"] }),
                "saved",
            )
        })

        expect([...result.current.plannedPath]).toEqual(["0,1"])
        expect(result.current.activePlanner?.id).toBe("a")
        expect(setMessage).toHaveBeenLastCalledWith('Loaded "a".')
    })

    it("renames, updating the active route's name too", () => {
        const { result } = setup({
            saved: [entry("a")],
            initial: {
                ...withRoute,
                activePlanner: { id: "a", name: "a", source: "saved" },
            },
        })

        act(() => {
            result.current.renamePlanner("a", "New")
        })

        expect(result.current.savedPlanners[0].name).toBe("New")
        expect(result.current.activePlanner?.name).toBe("New")
    })

    it("leaves another active route's name alone", () => {
        const { result } = setup({
            saved: [entry("a")],
            initial: {
                ...withRoute,
                activePlanner: { id: "b", name: "b", source: "history" },
            },
        })

        act(() => {
            result.current.renamePlanner("a", "New")
        })

        expect(result.current.activePlanner?.name).toBe("b")
    })

    it("deletes", () => {
        const { result } = setup({ saved: [entry("a"), entry("b")] })

        act(() => {
            result.current.deletePlanner("a")
        })

        expect(result.current.savedPlanners.map((item) => item.id)).toEqual([
            "b",
        ])
    })

    it("shows a save failure and keeps the list", () => {
        const { result, setMessage } = setup({ saved: [entry("a")] })

        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("quota")
        })
        act(() => {
            result.current.deletePlanner("a")
        })

        expect(result.current.savedPlanners).toHaveLength(1)
        expect(setMessage).toHaveBeenLastCalledWith(
            "Could not save board data: quota",
        )
    })
})

describe("history", () => {
    it("keeps an entry as a saved route", () => {
        writePlannerHistory(CLASS, "nezekan", [entry("a")])

        const { result, setMessage } = setup({ history: [entry("a")] })

        act(() => {
            result.current.keepHistoryEntry("a", "Kept")
        })

        expect(result.current.plannerHistory).toEqual([])
        expect(result.current.savedPlanners[0].name).toBe("Kept")
        expect(setMessage).toHaveBeenLastCalledWith('Saved "Kept".')
    })

    it("names every board an optimize-all run was kept on", () => {
        const run = { name: "Run", createdAt: 7 }

        writePlannerHistory(CLASS, "nezekan", [entry("a", run)])
        writePlannerHistory(CLASS, "zikel", [entry("b", run)])
        writePlannerHistory(CLASS, "vaizel", [entry("c", run)])

        const { result, setMessage } = setup({ history: [entry("a", run)] })

        act(() => {
            result.current.keepHistoryEntry("a", "Kept")
        })

        expect(setMessage).toHaveBeenLastCalledWith(
            'Saved "Kept" on Nezekan, Zikel and Vaizel.',
        )
    })

    it("reports an entry that's gone", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.keepHistoryEntry("gone", "Kept")
        })

        expect(setMessage).toHaveBeenLastCalledWith(
            "That history entry no longer exists.",
        )
    })

    it("deletes an entry", () => {
        const { result, setMessage } = setup({ history: [entry("a")] })

        act(() => {
            result.current.deletePlannerHistoryEntry("a")
        })

        expect(result.current.plannerHistory).toEqual([])
        expect(setMessage).toHaveBeenLastCalledWith(
            "Optimization history entry deleted.",
        )
    })
})

describe("when an all-board run replaces plans", () => {
    const replaced: BoardProgress = {
        ...withRoute,
        plannedCost: 8,
        activePlanner: { id: "x", name: "Plan", source: "history" },
    }

    it("reloads this board and shows the planner", () => {
        const { result, setView, setMessage } = setup()

        writeBoardProgress(CLASS, "nezekan", replaced)
        act(() => {
            notifyPlansReplaced(["nezekan"])
        })

        expect(result.current.plannedCost).toBe(8)
        expect(setView).toHaveBeenCalledWith("planner")
        expect(setMessage).toHaveBeenLastCalledWith('Loaded "Plan".')
    })

    it("reloads when no boards are named", () => {
        const { result } = setup()

        writeBoardProgress(CLASS, "nezekan", replaced)
        act(() => {
            notifyPlansReplaced()
        })

        expect(result.current.plannedCost).toBe(8)
    })

    it("ignores changes to other boards", () => {
        const { result } = setup()

        writeBoardProgress(CLASS, "nezekan", replaced)
        act(() => {
            notifyPlansReplaced(["zikel"])
        })

        expect(result.current.plannedCost).toBeNull()
    })

    it("shows a read error instead of loading", () => {
        const { result, setMessage } = setup()

        localStorage.setItem(`daevanion:v1:${CLASS}:nezekan:progress`, "{")
        act(() => {
            notifyPlansReplaced(["nezekan"])
        })

        expect(result.current.plannedCost).toBeNull()
        expect(setMessage.mock.lastCall?.[0]).toContain("Could not read")
    })
})
