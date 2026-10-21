import type { ClassPreset } from "@config/classPresets"
import {
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react"
import type { Position } from "@planner/config/boardConfig"
import { isMainBoard, type BoardId } from "@config/boards"
import type { BoardLayout } from "@planner/config/layouts"
import {
    formatPlannerDuration,
    type PlannerProgress,
} from "@planner/logic/plannerLogic"
import { formatPlanTime } from "@planner/logic/formatPlanTime"
import { routeStatScore, statWeights } from "@planner/config/stats"
import {
    pathPriorities,
    type PathPriorities,
} from "@planner/logic/pathPriorities"
import {
    DEFAULT_ARIEL_SETTINGS,
    readArielSettings,
} from "@planner/storage/arielSettings"
import {
    DEFAULT_STAT_SETTINGS,
    readStatSettings,
} from "@planner/storage/statPriorities"
import {
    writePlannerHistory,
    type ActivePlanner,
    type BoardProgress,
    type SavedPlanner,
} from "@planner/storage/boardStorage"

type SerializedPlannerResult =
    | {
          ok: true
          path: string[]
          cost: number
          statScore: number
          // Grown with stat nodes from leftover points; costs more on purpose.
          extended?: boolean
      }
    | { ok: false; reason: string }
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
    classPreset: ClassPreset
    layoutName: BoardId
    start: Position
    targetCells: Set<string>
    // Route preferences: nodes marked Need, and ids marked Prefer.
    needCells: ReadonlySet<string>
    preferred: ReadonlySet<string>
    plannedPath: Set<string>
    plannedCost: number | null
    availablePoints: number
    plannerHistory: SavedPlanner[]
    setPlannerHistory: Dispatch<SetStateAction<SavedPlanner[]>>
    setPlannedPath: Dispatch<SetStateAction<Set<string>>>
    setPlannedCost: Dispatch<SetStateAction<number | null>>
    setActivePlanner: Dispatch<SetStateAction<ActivePlanner | null>>
    persistProgress: (updates?: Partial<BoardProgress>) => string | null
    setMessage: (message: string) => void
}

export const usePlannerOptimization = ({
    layout,
    classPreset,
    layoutName,
    start,
    targetCells,
    needCells,
    preferred,
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
    const classId = classPreset.id
    const [isOptimizing, setIsOptimizing] = useState(false)
    const [optimizationProgress, setOptimizationProgress] =
        useState<PlannerProgress | null>(null)
    const plannerWorker = useRef<Worker | null>(null)
    const bestPlannerResult = useRef<Extract<
        SerializedPlannerResult,
        { ok: true }
    > | null>(null)

    useEffect(() => () => plannerWorker.current?.terminate(), [])

    // Ariel ranks its own stats and spends all of its points on them.
    const readPriorities = (): {
        statTiers: Parameters<typeof statWeights>[1]
        spendLeftover: boolean
        priorities: PathPriorities
    } => {
        if (!isMainBoard(layoutName)) {
            let arielSettings = DEFAULT_ARIEL_SETTINGS
            try {
                arielSettings = readArielSettings(classId)
            } catch {
                // Fall back to the default Ariel priorities.
            }

            return {
                statTiers: arielSettings.tiers,
                spendLeftover: false,
                priorities: {
                    weights: [
                        ...statWeights(
                            layout.nodeStats,
                            arielSettings.tiers,
                        ).entries(),
                    ],
                    focusGroups: [],
                },
            }
        }

        let statSettings = DEFAULT_STAT_SETTINGS
        try {
            statSettings = readStatSettings(classId)
        } catch {
            // Fall back to the default stat priorities.
        }

        return {
            statTiers: statSettings.tiers,
            spendLeftover: statSettings.spendLeftover,
            priorities: pathPriorities({
                classPreset: classPreset,
                layoutName: layoutName,
                preferred: preferred,
                statSettings: statSettings,
            }),
        }
    }

    const optimizePlanner = (timeBudgetMs = 1500) => {
        const { statTiers, spendLeftover, priorities } = readPriorities()
        const weights = new Map(priorities.weights)
        // The nodes you clicked plus the ones Route preferences need.
        const requiredCells = new Set([...targetCells, ...needCells])
        // A route that misses a newly needed node can't be kept.
        const previousBest =
            plannedCost === null ||
            [...requiredCells].some((key) => !plannedPath.has(key))
                ? null
                : {
                      ok: true as const,
                      path: [...plannedPath],
                      cost: plannedCost,
                      statScore: routeStatScore(plannedPath, weights),
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
                    const best = bestPlannerResult.current
                    const candidate = resultMessage.result
                    // Cheaper wins; at equal cost, better stats win. Routes
                    // grown with leftover stat points are always taken.
                    const isBetter =
                        !best ||
                        candidate.extended ||
                        candidate.cost < best.cost ||
                        (candidate.cost === best.cost &&
                            candidate.statScore > best.statScore)
                    if (!isBetter) {
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
                // A route grown with stat nodes costs more on purpose.
                if (
                    previousBest &&
                    !bestResult.extended &&
                    bestResult.cost >= previousBest.cost
                ) {
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
                    availablePoints: availablePoints,
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
                } else if (!isMainBoard(layoutName)) {
                    // Ariel's route is built in one go, not searched for.
                    setMessage(
                        "Ariel route built and saved to optimization history.",
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
                layout: layout,
                start: start,
                targets: [...requiredCells],
                timeBudgetMs: timeBudgetMs,
                statTiers: statTiers,
                spendLeftover: spendLeftover,
                availablePoints: availablePoints,
                priorities: priorities,
                growStats: !isMainBoard(layoutName),
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
        isOptimizing: isOptimizing,
        optimizationProgress: optimizationProgress,
        optimizePlanner: optimizePlanner,
        cancelOptimization: cancelOptimization,
    }
}
