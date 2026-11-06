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
import { DEFAULT_STALL_SECONDS } from "@planner/config/searchTime"
import { formatPlanTime } from "@planner/logic/formatPlanTime"
import {
    joinParagraphs,
    NO_FINDS,
    searchSummary,
} from "@planner/logic/improvementStatus"
import { routeStatScore, statWeights, tierValues } from "@planner/config/stats"
import {
    pathPriorities,
    type PathPriorities,
} from "@planner/logic/pathPriorities"
import { statValues } from "@planner/logic/statOrder"
import {
    DEFAULT_ARIEL_SETTINGS,
    readArielSettings,
} from "@planner/storage/arielSettings"
import {
    defaultStatSettings,
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
          // Maxed stat nodes cost more on purpose.
          extended?: boolean
      }
    | { ok: false; reason: string }
type PlannerWorkerMessage =
    | { type: "progress"; progress?: PlannerProgress | number }
    | {
          type: "candidate"
          result: Extract<SerializedPlannerResult, { ok: true }>
          elapsedMs?: number
      }
    | {
          type: "done"
          result: { ok: true } | { ok: false; reason: string }
          elapsedMs?: number
      }
    | { type: "error"; message: string }

type UsePlannerOptimizationProps = {
    layout: BoardLayout
    classPreset: ClassPreset
    layoutName: BoardId
    start: Position
    targetCells: Set<string>
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
    const [routeFinds, setRouteFinds] = useState(NO_FINDS)
    // Improve starts from the route already shown.
    const [improvesCurrent, setImprovesCurrent] = useState(false)
    // Stop was pressed; the worker is wrapping up its route.
    const [isStopping, setIsStopping] = useState(false)
    const plannerWorker = useRef<Worker | null>(null)
    const bestPlannerResult = useRef<Extract<
        SerializedPlannerResult,
        { ok: true }
    > | null>(null)

    useEffect(() => () => plannerWorker.current?.terminate(), [])

    const readPriorities = (): {
        statValues: Parameters<typeof statWeights>[1]
        priorities: PathPriorities
    } => {
        if (!isMainBoard(layoutName)) {
            let arielSettings = DEFAULT_ARIEL_SETTINGS
            try {
                arielSettings = readArielSettings(classId)
            } catch {
                // Use the default Ariel priorities.
            }

            const values = tierValues(arielSettings.tiers)
            return {
                statValues: values,
                priorities: {
                    weights: [
                        ...statWeights(layout.nodeStats, values).entries(),
                    ],
                    focusGroups: [],
                },
            }
        }

        let statSettings = defaultStatSettings(classId)
        try {
            statSettings = readStatSettings(classId)
        } catch {
            // Use the default stat priorities.
        }

        return {
            statValues: statValues(statSettings),
            priorities: pathPriorities({
                classPreset: classPreset,
                layoutName: layoutName,
                preferred: preferred,
                statSettings: statSettings,
            }),
        }
    }

    // The search ends once stallMs pass without a better route.
    const optimizePlanner = (stallMs = DEFAULT_STALL_SECONDS * 1000) => {
        const { statValues: values, priorities } = readPriorities()
        const weights = new Map(priorities.weights)
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
        setImprovesCurrent(previousBest !== null)
        setMessage("")
        // This run's own count, for the message once it's done.
        let finds = NO_FINDS

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
                        finds = { ...finds, optionsChecked: progress.attempts }
                        setRouteFinds(finds)
                    }
                    return
                }

                if (resultMessage.type === "candidate") {
                    const best = bestPlannerResult.current
                    const candidate = resultMessage.result
                    // Cheaper wins, then better stats; routes with maxed stats are always taken.
                    const isBetter =
                        !best ||
                        candidate.extended ||
                        candidate.cost < best.cost ||
                        (candidate.cost === best.cost &&
                            candidate.statScore > best.statScore)
                    if (!isBetter) {
                        return
                    }
                    const foundAt = resultMessage.elapsedMs ?? 0
                    finds = best
                        ? {
                              ...finds,
                              improvements: finds.improvements + 1,
                              lastImprovedMs: foundAt,
                          }
                        : { ...finds, firstFoundMs: foundAt }
                    setRouteFinds(finds)
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
                setIsStopping(false)
                setOptimizationProgress(null)
                const searchedFor = formatPlannerDuration(
                    resultMessage.type === "done"
                        ? (resultMessage.elapsedMs ?? 0)
                        : 0,
                )

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
                // Still the starting route: nothing cheaper or with better
                // stats beat it.
                if (previousBest && bestResult === previousBest) {
                    setMessage(
                        joinParagraphs(
                            `No better route found after ${searchedFor}; kept the previous ${previousBest.cost}-point route.`,
                            searchSummary({
                                finds: finds,
                                noun: "route",
                                fromCurrent: true,
                            }),
                        ),
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
                    setMessage(
                        "Ariel route built and saved to optimization history.",
                    )
                } else {
                    setMessage(
                        joinParagraphs(
                            `Best route found after ${searchedFor} and saved to optimization history.`,
                            searchSummary({
                                finds: finds,
                                noun: "route",
                                fromCurrent: previousBest !== null,
                            }),
                        ),
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
                type: "start",
                layout: layout,
                start: start,
                targets: [...requiredCells],
                stallMs: stallMs,
                statValues: values,
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

    // Ends the search early and keeps the best route so far.
    const stopOptimization = () => {
        plannerWorker.current?.postMessage({ type: "stop" })
        setIsStopping(true)
    }

    const cancelOptimization = () => {
        plannerWorker.current?.terminate()
        plannerWorker.current = null
        setIsOptimizing(false)
        setIsStopping(false)
        setOptimizationProgress(null)
        setRouteFinds(NO_FINDS)
        bestPlannerResult.current = null
    }

    return {
        isOptimizing: isOptimizing,
        isStopping: isStopping,
        optimizationProgress: optimizationProgress,
        routeFinds: routeFinds,
        improvesCurrent: improvesCurrent,
        optimizePlanner: optimizePlanner,
        stopOptimization: stopOptimization,
        cancelOptimization: cancelOptimization,
    }
}
