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
import {
    writeArielSettings,
    DEFAULT_ARIEL_SETTINGS,
} from "@planner/storage/arielSettings"
import {
    readBoardProgress,
    readPlannerHistory,
    subscribeToPlansReplaced,
    writeBoardProgress,
} from "@planner/storage/boardStorage"
import { writeClassSettings } from "@planner/storage/classSettings"
import { installFakeWorker, lastWorker } from "@test/fakeWorker"
import { usePriorityOptimizer } from "./usePriorityOptimizer"

const CLASS = "gladiator"

let preset: ClassPreset

beforeAll(async () => {
    preset = await loadClassPreset(CLASS)
})

beforeEach(() => {
    installFakeWorker()
})

afterEach(() => {
    vi.unstubAllGlobals()
})

const plan = (cost: number) => {
    return {
        targetCells: ["0,0"],
        plannedPath: ["0,0"],
        plannedCost: cost,
    }
}

const done = (overrides: object = {}) => {
    return {
        type: "done",
        plans: {
            nezekan: plan(10),
            zikel: plan(20),
            vaizel: plan(30),
            triniel: plan(40),
        },
        shortfalls: [],
        specialNodes: { taken: 2, total: 2 },
        finds: {
            optionsChecked: 4820,
            firstFoundMs: 4200,
            improvements: 3,
            lastImprovedMs: 42_000,
        },
        ...overrides,
    }
}

const setup = () => {
    const onComplete = vi.fn()
    const hook = renderHook(() => {
        return usePriorityOptimizer({
            classPreset: preset,
            totalPoints: 225,
            onComplete: onComplete,
        })
    })

    return {
        result: hook.result,
        unmount: hook.unmount,
        onComplete: onComplete,
    }
}

describe("usePriorityOptimizer", () => {
    it("sends the budget, stall time and saved settings to the worker", () => {
        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })

        expect(result.current.isOptimizing).toBe(true)
        expect(lastWorker().posted[0]).toMatchObject({
            type: "start",
            pointBudget: 225,
            stallMs: 10_000,
        })
    })

    it("sends a skipped ability with no minimum and a cap of 0", () => {
        const ability = preset.abilities[0]
        writeClassSettings(CLASS, "abilities", {
            [ability.id]: { skip: true, min: 3 },
        })
        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })

        expect(lastWorker().posted[0]).toMatchObject({
            minimums: { [ability.id]: 0 },
            maximums: { [ability.id]: 0 },
        })
    })

    it("explains settings it can't read, without starting", () => {
        writeClassSettings(CLASS, "abilities", 5)

        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })

        expect(result.current.isOptimizing).toBe(false)
        expect(result.current.message).toContain(
            "Could not read ability priorities",
        )
    })

    it("shows progress", () => {
        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })
        lastWorker().emit({
            type: "progress",
            progress: {
                elapsedMs: 1,
                idleMs: 0,
                stallMs: 2,
                phase: "refine",
                pointsUsed: 3,
                finds: {
                    optionsChecked: 10,
                    firstFoundMs: 1,
                    improvements: 0,
                    lastImprovedMs: null,
                },
            },
        })

        expect(result.current.progress?.pointsUsed).toBe(3)
    })

    it("asks the worker to stop, then records the plan it kept", () => {
        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })
        const worker = lastWorker()

        act(() => {
            result.current.stop()
        })

        expect(worker.posted.at(-1)).toEqual({ type: "stop" })
        expect(worker.terminated).toBe(false)
        expect(result.current.isStopping).toBe(true)

        worker.emit(done())

        expect(result.current.isStopping).toBe(false)
        expect(result.current.isOptimizing).toBe(false)
        expect(readPlannerHistory(CLASS, "triniel").value).toHaveLength(1)
    })

    it("records every main board and reports what it spent", () => {
        const { result, onComplete } = setup()

        act(() => {
            result.current.optimize(10)
        })

        const worker = lastWorker()

        worker.emit(done())

        expect(worker.terminated).toBe(true)
        expect(result.current.isOptimizing).toBe(false)
        expect(readPlannerHistory(CLASS, "triniel").value?.[0]).toMatchObject({
            plannedCost: 40,
        })
        expect(readPlannerHistory(CLASS, "ariel").value).toBeNull()
        expect(result.current.message).toBe(
            "Optimized all four boards using 100 of 225 shared points. Ariel has no points, so its route was left as is.\n\nChecked 4,820 options. Found 3 better plans after the first, the last at 42s.",
        )
        expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it("says when no better plan turned up", () => {
        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })
        lastWorker().emit(
            done({
                finds: {
                    optionsChecked: 4820,
                    firstFoundMs: 4200,
                    improvements: 0,
                    lastImprovedMs: null,
                },
            }),
        )

        expect(result.current.message).toContain(
            "points. Ariel has no points, so its route was left as is.\n\nChecked 4,820 options. No better plan turned up after the first at 4.2s.",
        )
    })

    it("plans Ariel too once it has points", () => {
        writeArielSettings(CLASS, { ...DEFAULT_ARIEL_SETTINGS, points: 30 })

        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })
        lastWorker().emit(done())

        expect(readPlannerHistory(CLASS, "ariel").value).toHaveLength(1)
        expect(result.current.message).toContain("of 30 Ariel points")
    })

    it("applies plans only when told, keeping manual picks", () => {
        const { result, onComplete } = setup()
        const replaced = vi.fn()
        const unsubscribe = subscribeToPlansReplaced(replaced)

        writeBoardProgress(CLASS, "nezekan", {
            selectedCells: ["9,9"],
            availablePoints: 1,
            targetCells: [],
            plannedPath: [],
            plannedCost: null,
        })
        act(() => {
            result.current.optimize(10)
        })
        lastWorker().emit(done())

        expect(
            readBoardProgress(CLASS, "nezekan").value?.plannedCost,
        ).toBeNull()
        expect(replaced).not.toHaveBeenCalled()

        act(() => {
            onComplete.mock.calls[0][0]()
        })
        unsubscribe()

        expect(readBoardProgress(CLASS, "nezekan").value).toMatchObject({
            selectedCells: ["9,9"],
            plannedCost: 10,
            activePlanner: { source: "history" },
        })
        expect(replaced).toHaveBeenCalledTimes(1)
    })

    it("reports boards it couldn't record, and still does the rest", () => {
        localStorage.setItem(`daevanion:v1:${CLASS}:zikel:planner-history`, "{")

        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })
        lastWorker().emit(done())

        expect(result.current.message).toContain(
            "Some board plans could not be fully saved: Zikel:",
        )
        expect(readPlannerHistory(CLASS, "vaizel").value).toHaveLength(1)
    })

    it("reports boards it couldn't apply", () => {
        const { result, onComplete } = setup()

        act(() => {
            result.current.optimize(10)
        })
        lastWorker().emit(done())
        localStorage.setItem(`daevanion:v1:${CLASS}:zikel:progress`, "{")
        act(() => {
            onComplete.mock.calls[0][0]()
        })

        expect(result.current.message).toContain(
            "Some boards could not be updated: Zikel:",
        )
    })

    it("flags a plan short of minimums or special nodes", () => {
        const { result } = setup()
        const shortfalls = [
            { abilityId: "a", name: "A", required: 2, achieved: 1 },
        ]

        act(() => {
            result.current.optimize(10)
        })
        lastWorker().emit(done({ shortfalls: shortfalls }))
        expect(result.current.shortfall?.shortfalls).toEqual(shortfalls)

        act(() => {
            result.current.optimize(10)
        })
        expect(result.current.shortfall).toBeNull()

        lastWorker().emit(done({ specialNodes: { taken: 1, total: 2 } }))
        expect(result.current.shortfall?.specialNodes.taken).toBe(1)

        act(() => {
            result.current.optimize(10)
        })
        lastWorker().emit(done())
        expect(result.current.shortfall).toBeNull()
    })

    it("reports worker failures of every kind", () => {
        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })
        lastWorker().emit({ type: "error", message: "Boom" })
        expect(result.current.message).toBe("Boom")
        expect(result.current.isOptimizing).toBe(false)

        act(() => {
            result.current.optimize(10)
        })
        act(() => {
            lastWorker().onerror?.({ message: "" })
        })
        expect(result.current.message).toBe(
            "The all-board priority optimizer failed.",
        )

        act(() => {
            result.current.optimize(10)
        })
        act(() => {
            lastWorker().onmessageerror?.()
        })
        expect(result.current.message).toBe(
            "The all-board optimizer returned unreadable data.",
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

        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })

        expect(result.current.message).toBe("No workers here")
        expect(result.current.isOptimizing).toBe(false)
    })

    it("cancels", () => {
        const { result } = setup()

        act(() => {
            result.current.optimize(10)
        })

        const worker = lastWorker()

        act(() => {
            result.current.cancel()
        })

        expect(worker.terminated).toBe(true)
        expect(result.current.message).toBe("All-board optimization cancelled.")
    })

    it("stops the worker when the page closes", () => {
        const { result, unmount } = setup()

        act(() => {
            result.current.optimize(10)
        })
        unmount()

        expect(lastWorker().terminated).toBe(true)
    })
})
