import {
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react"
import type { Position } from "../config/boardConfig"
import type { BoardLayout, BoardLayoutName } from "../config/layouts"
import {
    formatPlannerDuration,
    type PlannerProgress,
} from "../logic/plannerLogic"
import { formatPlanTime } from "../logic/formatPlanTime"
import {
    writePlannerHistory,
    type ActivePlanner,
    type BoardProgress,
    type SavedPlanner,
} from "../storage/boardStorage"

type SerializedPlannerResult =
    { ok: true; path: string[]; cost: number } | { ok: false; reason: string }
type PlannerWorkerMessage =
    | { type: "progress"; progress?: PlannerProgress | number }
    | {
          type: "candidate"
          result: Extract<SerializedPlannerResult, { ok: true }>
      }
    | { type: "done"; result: { ok: true } | { ok: false; reason: string } }
    | { type: "error"; message: string }

type UsePlannerOptimizationProps = {
    layout: BoardLayout
    classId: string
    layoutName: BoardLayoutName
    start: Position
    targetCells: Set<string>
    plannedPath: Set<string>
    plannedCost: number | null
    availablePoints: number
    plannerHistory: SavedPlanner[]
    setPlannerHistory: Dispatch<SetStateAction<SavedPlanner[]>>
    setPlannedPath: Dispatch<SetStateAction<Set<string>>>
    setPlannedCost: Dispatch<SetStateAction<number | null>>
    setActivePlanner: Dispatch<SetStateAction<ActivePlanner | null>>
    persistProgress: (updates?: Partial<BoardProgress>) => string | null
    setMessage: Dispatch<SetStateAction<string>>
}

export const usePlannerOptimization = ({
    layout,
    classId,
    layoutName,
    start,
    targetCells,
    plannedPath,
    plannedCost,
    availablePoints,
    plannerHistory,
    setPlannerHistory,
    setPlannedPath,
    setPlannedCost,
    setActivePlanner,
    persistProgress,
    setMessage,
}: UsePlannerOptimizationProps) => {
    const plannerWorker = useRef<Worker | null>(null)
    const bestPlannerResult = useRef<Extract<
        SerializedPlannerResult,
        { ok: true }
    > | null>(null)
    const [isOptimizing, setIsOptimizing] = useState(false)
    const [optimizationProgress, setOptimizationProgress] =
        useState<PlannerProgress | null>(null)

    useEffect(() => () => plannerWorker.current?.terminate(), [])

    const optimizePlanner = (timeBudgetMs = 1500) => {
        const previousBest =
            plannedCost === null
                ? null
                : {
                      ok: true as const,
                      path: [...plannedPath],
                      cost: plannedCost,
                  }
        cancelOptimization()
        setOptimizationProgress(null)
        bestPlannerResult.current = previousBest
        setMessage("")

        try {
            const worker = new Worker(
                new URL("../workers/planner.worker.ts", import.meta.url),
                { type: "module" },
            )
            plannerWorker.current = worker
            setIsOptimizing(true)

            worker.onmessage = (event: MessageEvent<PlannerWorkerMessage>) => {
                const resultMessage = event.data
                if (resultMessage.type === "progress") {
                    const progress = resultMessage.progress
                    if (
                        progress &&
                        typeof progress === "object" &&
                        Number.isFinite(progress.attempts) &&
                        Number.isFinite(progress.elapsedMs)
                    ) {
                        setOptimizationProgress(progress)
                    }
                    return
                }

                if (resultMessage.type === "candidate") {
                    if (
                        bestPlannerResult.current &&
                        bestPlannerResult.current.cost <=
                            resultMessage.result.cost
                    ) {
                        return
                    }
                    bestPlannerResult.current = resultMessage.result
                    setPlannedPath(new Set(resultMessage.result.path))
                    setPlannedCost(resultMessage.result.cost)
                    const progressError = persistProgress({
                        plannedPath: resultMessage.result.path,
                        plannedCost: resultMessage.result.cost,
                    })
                    if (progressError) {
                        setMessage(
                            `A route was found but could not be saved: ${progressError}`,
                        )
                    }
                    return
                }

                worker.terminate()
                plannerWorker.current = null
                setIsOptimizing(false)
                setOptimizationProgress(null)

                if (resultMessage.type === "error") {
                    setMessage(resultMessage.message)
                    return
                }

                if (!resultMessage.result.ok && !bestPlannerResult.current) {
                    setMessage(resultMessage.result.reason)
                    return
                }

                const bestResult = bestPlannerResult.current
                if (!bestResult) {
                    setMessage(
                        "The planner finished without returning a route.",
                    )
                    return
                }
                if (previousBest && bestResult.cost >= previousBest.cost) {
                    setMessage(
                        `No better route found after ${formatPlannerDuration(timeBudgetMs)}; kept the previous ${previousBest.cost}-point route.`,
                    )
                    return
                }

                const completedAt = Date.now()
                const historyEntry: SavedPlanner = {
                    id: crypto.randomUUID(),
                    name: `Optimizer run · ${formatPlanTime(completedAt)}`,
                    createdAt: completedAt,
                    targetCells: [...targetCells],
                    plannedPath: bestResult.path,
                    plannedCost: bestResult.cost,
                    availablePoints,
                }
                const nextHistory = [historyEntry, ...plannerHistory].slice(
                    0,
                    25,
                )
                const historyError = writePlannerHistory(
                    classId,
                    layoutName,
                    nextHistory,
                )
                if (!historyError) {
                    setPlannerHistory(nextHistory)
                }
                const selectedPlanner: ActivePlanner = {
                    id: historyEntry.id,
                    name: historyEntry.name,
                    source: "history",
                }
                setActivePlanner(selectedPlanner)
                const progressError = persistProgress({
                    plannedPath: bestResult.path,
                    plannedCost: bestResult.cost,
                    activePlanner: selectedPlanner,
                })
                const saveError = historyError ?? progressError
                if (saveError) {
                    setMessage(
                        `Route found, but it could not be saved to browser history: ${saveError}`,
                    )
                } else {
                    setMessage(
                        `Best route found after ${formatPlannerDuration(timeBudgetMs)} and saved to optimization history.`,
                    )
                }
            }

            worker.onerror = (event) => {
                worker.terminate()
                plannerWorker.current = null
                setIsOptimizing(false)
                setOptimizationProgress(null)
                setMessage(
                    event.message ||
                        "The route optimization worker failed. Please try again.",
                )
            }

            worker.onmessageerror = () => {
                worker.terminate()
                plannerWorker.current = null
                setIsOptimizing(false)
                setOptimizationProgress(null)
                setMessage(
                    "The route optimizer returned data the page could not read. Please try again.",
                )
            }

            worker.postMessage({
                layout,
                start,
                targets: [...targetCells],
                timeBudgetMs,
            })
        } catch (error) {
            plannerWorker.current?.terminate()
            plannerWorker.current = null
            setIsOptimizing(false)
            setOptimizationProgress(null)
            setMessage(
                error instanceof Error
                    ? error.message
                    : "The route optimization worker could not be started.",
            )
        }
    }

    const cancelOptimization = () => {
        plannerWorker.current?.terminate()
        plannerWorker.current = null
        setIsOptimizing(false)
        setOptimizationProgress(null)
        bestPlannerResult.current = null
    }

    return {
        isOptimizing,
        optimizationProgress,
        optimizePlanner,
        cancelOptimization,
    }
}
