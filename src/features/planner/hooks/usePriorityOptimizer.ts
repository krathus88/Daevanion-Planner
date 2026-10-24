import type { ClassPreset } from "@config/classPresets"
import { useEffect, useRef, useState } from "react"
import {
    BOARD_IDS,
    BOARD_NAMES,
    MAIN_BOARD_IDS,
    type BoardId,
} from "@config/boards"
import { planArielRoute } from "@planner/logic/arielRoute"
import { errorMessage } from "@planner/logic/errorMessage"
import { formatPlanTime } from "@planner/logic/formatPlanTime"
import type { PriorityPlannerProgress } from "@planner/logic/priorityPlanner"
import {
    readAbilityMaximums,
    readAbilityMinimums,
    readAbilityPriorities,
    resolveAbilityMinimums,
    type MinimumShortfall,
    type PriorityPlans,
} from "@planner/storage/abilityPriorities"
import {
    notifyPlansReplaced,
    readBoardProgress,
    readPlannerHistory,
    writeBoardProgress,
    writePlannerHistory,
    type ActivePlanner,
    type SavedPlanner,
} from "@planner/storage/boardStorage"
import {
    readArielSettings,
    type ArielSettings,
} from "@planner/storage/arielSettings"
import { readRankOrder } from "@planner/storage/rankOrder"
import { readSpecialPriorities } from "@planner/storage/specialPriorities"
import { readStatSettings } from "@planner/storage/statPriorities"

type PriorityWorkerMessage =
    | { type: "progress"; progress: PriorityPlannerProgress }
    | {
          type: "done"
          plans: PriorityPlans
          shortfalls: MinimumShortfall[]
          specialNodes: { taken: number; total: number }
      }
    | { type: "error"; message: string }

type RecordedPlans = Partial<Record<BoardId, SavedPlanner>>

type UsePriorityOptimizerOptions = {
    classPreset: ClassPreset
    totalPoints: number
    onComplete: (applyResults: () => void) => void
}

export type OptimizeShortfall = {
    shortfalls: MinimumShortfall[]
    specialNodes: { taken: number; total: number }
}

export const usePriorityOptimizer = ({
    classPreset,
    totalPoints,
    onComplete,
}: UsePriorityOptimizerOptions) => {
    const [progress, setProgress] = useState<PriorityPlannerProgress | null>(
        null,
    )
    const [message, setMessage] = useState("")
    const [shortfall, setShortfall] = useState<OptimizeShortfall | null>(null)
    const [isOptimizing, setIsOptimizing] = useState(false)
    const workerRef = useRef<Worker | null>(null)

    useEffect(() => () => workerRef.current?.terminate(), [])

    const finish = (worker: Worker) => {
        worker.terminate()
        if (workerRef.current === worker) {
            workerRef.current = null
        }

        setIsOptimizing(false)
    }

    const recordPlans = (
        mainPlans: PriorityPlans,
        arielSettings: ArielSettings,
    ) => {
        const plans = { ...mainPlans, ariel: planArielRoute(arielSettings) }
        // Ariel's route is left as is until it has points to spend.
        const hasArielPoints = arielSettings.points > 0
        const boards = hasArielPoints ? BOARD_IDS : MAIN_BOARD_IDS
        const now = Date.now()
        const planName = `Priority plan · ${formatPlanTime(now)}`
        const entries: RecordedPlans = {}
        const errors: string[] = []

        for (const layoutName of boards) {
            const stored = readPlannerHistory(classPreset.id, layoutName)
            if (stored.error) {
                errors.push(`${BOARD_NAMES[layoutName]}: ${stored.error}`)
                continue
            }

            const plan = plans[layoutName]
            const entry: SavedPlanner = {
                id: crypto.randomUUID(),
                name: planName,
                createdAt: now,
                targetCells: plan.targetCells,
                plannedPath: plan.plannedPath,
                plannedCost: plan.plannedCost,
                availablePoints: plan.plannedCost,
            }
            const saveError = writePlannerHistory(classPreset.id, layoutName, [
                entry,
                ...(stored.value ?? []),
            ])
            if (saveError) {
                errors.push(`${BOARD_NAMES[layoutName]}: ${saveError}`)
                continue
            }

            entries[layoutName] = entry
        }

        if (errors.length > 0) {
            setMessage(
                `Some board plans could not be fully saved: ${errors.join(" ")}`,
            )
        } else {
            const spent = MAIN_BOARD_IDS.reduce(
                (sum, layoutName) => sum + plans[layoutName].plannedCost,
                0,
            )
            setMessage(
                hasArielPoints
                    ? `Optimized all four boards using ${spent} of ${totalPoints} shared points, and Ariel using ${plans.ariel.plannedCost} of ${arielSettings.points} Ariel points.`
                    : `Optimized all four boards using ${spent} of ${totalPoints} shared points. Ariel has no points, so its route was left as is.`,
            )
        }

        return entries
    }

    // Called once the All boards tab is open, so a run doesn't replace the
    // board you're on.
    const applyPlans = (entries: RecordedPlans) => {
        const errors: string[] = []
        for (const layoutName of Object.keys(entries) as BoardId[]) {
            const entry = entries[layoutName]
            if (!entry) {
                continue
            }

            const previous = readBoardProgress(classPreset.id, layoutName)
            if (previous.error) {
                errors.push(`${BOARD_NAMES[layoutName]}: ${previous.error}`)
                continue
            }

            const activePlanner: ActivePlanner = {
                id: entry.id,
                name: entry.name,
                source: "history",
            }
            const progressError = writeBoardProgress(
                classPreset.id,
                layoutName,
                {
                    selectedCells: previous.value?.selectedCells ?? [],
                    availablePoints: entry.availablePoints,
                    targetCells: entry.targetCells,
                    plannedPath: entry.plannedPath,
                    plannedCost: entry.plannedCost,
                    activePlanner: activePlanner,
                },
            )
            if (progressError) {
                errors.push(`${BOARD_NAMES[layoutName]}: ${progressError}`)
            }
        }

        if (errors.length > 0) {
            setMessage(`Some boards could not be updated: ${errors.join(" ")}`)
        }

        notifyPlansReplaced()
    }

    const handleMessage = (
        worker: Worker,
        data: PriorityWorkerMessage,
        arielSettings: ArielSettings,
    ) => {
        if (data.type === "progress") {
            setProgress(data.progress)
            return
        }

        finish(worker)
        if (data.type === "error") {
            setMessage(data.message)
            return
        }

        try {
            const entries = recordPlans(data.plans, arielSettings)
            onComplete(() => applyPlans(entries))
            const isShort =
                data.shortfalls.length > 0 ||
                data.specialNodes.taken < data.specialNodes.total
            setShortfall(
                isShort
                    ? {
                          shortfalls: data.shortfalls,
                          specialNodes: data.specialNodes,
                      }
                    : null,
            )
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? `Plans were found but could not be saved: ${error.message}`
                    : "Plans were found but could not be saved.",
            )
        }
    }

    const optimize = (searchSeconds: number) => {
        setMessage("")
        setShortfall(null)
        setProgress(null)

        let settings
        try {
            const priorities = readAbilityPriorities(classPreset)
            settings = {
                priorities: priorities,
                minimums: resolveAbilityMinimums(
                    classPreset,
                    priorities,
                    readAbilityMinimums(classPreset),
                ),
                maximums: readAbilityMaximums(classPreset),
                specialPriorities: readSpecialPriorities(classPreset.id),
                rankOrder: readRankOrder(classPreset.id),
                statSettings: readStatSettings(classPreset.id),
                arielSettings: readArielSettings(classPreset.id),
            }
        } catch (error) {
            setMessage(
                errorMessage(error, "Could not load class ability priorities."),
            )
            return
        }

        try {
            const worker = new Worker(
                new URL(
                    "../workers/priorityPlanner.worker.ts",
                    import.meta.url,
                ),
                { type: "module" },
            )
            workerRef.current = worker
            setIsOptimizing(true)
            worker.onmessage = (event: MessageEvent<PriorityWorkerMessage>) =>
                handleMessage(worker, event.data, settings.arielSettings)
            worker.onerror = (event) => {
                finish(worker)
                setMessage(
                    event.message || "The all-board priority optimizer failed.",
                )
            }
            worker.onmessageerror = () => {
                finish(worker)
                setMessage("The all-board optimizer returned unreadable data.")
            }
            worker.postMessage({
                classPreset: classPreset,
                ...settings,
                pointBudget: totalPoints,
                timeBudgetMs: searchSeconds * 1000,
            })
        } catch (error) {
            workerRef.current?.terminate()
            workerRef.current = null
            setIsOptimizing(false)
            setMessage(
                errorMessage(
                    error,
                    "The all-board priority optimizer could not start.",
                ),
            )
        }
    }

    const cancel = () => {
        workerRef.current?.terminate()
        workerRef.current = null
        setIsOptimizing(false)
        setProgress(null)
        setShortfall(null)
        setMessage("All-board optimization cancelled.")
    }

    return {
        isOptimizing: isOptimizing,
        progress: progress,
        message: message,
        shortfall: shortfall,
        optimize: optimize,
        cancel: cancel,
    }
}
