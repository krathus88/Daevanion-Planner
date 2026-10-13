import { useEffect, useRef, useState } from "react"
import { Box, Flex, Text } from "@chakra-ui/react"
import { PrimaryButton, SearchTimeSelect, SecondaryButton } from "./PanelKit"
import { DEFAULT_SEARCH_SECONDS } from "./searchTime"
import { formatPlanTime } from "../logic/formatPlanTime"
import type { ClassPreset } from "../../../../config/classPresets"
import { layouts, type BoardLayoutName } from "../config/layouts"
import type { PriorityPlannerProgress } from "../logic/priorityPlanner"
import {
    readAbilityMaximums,
    readAbilityMinimums,
    readAbilityPriorities,
    resolveAbilityMinimums,
    type MinimumShortfall,
    type PriorityPlans,
} from "../storage/abilityPriorities"
import {
    readBoardProgress,
    notifyPlansReplaced,
    readPlannerHistory,
    writeBoardProgress,
    writePlannerHistory,
    type ActivePlanner,
    type SavedPlanner,
} from "../storage/boardStorage"

type PriorityWorkerMessage =
    | { type: "progress"; progress: PriorityPlannerProgress }
    | { type: "done"; plans: PriorityPlans; shortfalls: MinimumShortfall[] }
    | { type: "error"; message: string }

type PriorityOptimizeAllBoardsProps = {
    classPreset: ClassPreset
    totalPoints: number
    // Receives a callback that applies the results to the boards.
    onComplete: (applyResults: () => void) => void
}

export const PriorityOptimizeAllBoards = ({
    classPreset,
    totalPoints,
    onComplete,
}: PriorityOptimizeAllBoardsProps) => {
    const workerRef = useRef<Worker | null>(null)
    const [progress, setProgress] = useState<PriorityPlannerProgress | null>(
        null,
    )
    const [message, setMessage] = useState("")
    const [warning, setWarning] = useState("")
    const [isOptimizing, setIsOptimizing] = useState(false)
    const [searchSeconds, setSearchSeconds] = useState(DEFAULT_SEARCH_SECONDS)

    useEffect(
        () => () => {
            workerRef.current?.terminate()
        },
        [],
    )

    const finish = (worker: Worker) => {
        worker.terminate()
        if (workerRef.current === worker) {
            workerRef.current = null
        }
        setIsOptimizing(false)
    }

    // Records each board's result in its optimizer history right away.
    const recordPlans = (plans: PriorityPlans) => {
        const now = Date.now()
        const planName = `Priority plan · ${formatPlanTime(now)}`
        const entries: Partial<Record<BoardLayoutName, SavedPlanner>> = {}
        const errors: string[] = []

        for (const layoutName of Object.keys(layouts) as BoardLayoutName[]) {
            const stored = readPlannerHistory(layoutName)
            if (stored.error) {
                errors.push(`${layoutName}: ${stored.error}`)
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
            const nextHistory = [entry, ...(stored.value ?? [])]
            const saveError = writePlannerHistory(layoutName, nextHistory)
            if (saveError) {
                errors.push(`${layoutName}: ${saveError}`)
                continue
            }
            entries[layoutName] = entry
        }

        if (errors.length > 0) {
            setMessage(
                `Some board plans could not be fully saved: ${errors.join(" ")}`,
            )
        } else {
            const spent = Object.values(plans).reduce(
                (sum, plan) => sum + plan.plannedCost,
                0,
            )
            setMessage(
                `Optimized all four boards using ${spent} of ${totalPoints} shared points.`,
            )
        }

        return entries
    }

    // Makes the recorded results every board's current route. The sidebar
    // calls this once the All boards tab is open, so a finished run doesn't
    // replace the board while you're working elsewhere.
    const applyPlans = (
        entries: Partial<Record<BoardLayoutName, SavedPlanner>>,
    ) => {
        const errors: string[] = []
        for (const layoutName of Object.keys(entries) as BoardLayoutName[]) {
            const entry = entries[layoutName]
            if (!entry) {
                continue
            }

            const previousProgress = readBoardProgress(layoutName)
            if (previousProgress.error) {
                errors.push(`${layoutName}: ${previousProgress.error}`)
                continue
            }

            const activePlanner: ActivePlanner = {
                id: entry.id,
                name: entry.name,
                source: "history",
            }
            const progressError = writeBoardProgress(layoutName, {
                selectedCells: previousProgress.value?.selectedCells ?? [],
                availablePoints: entry.availablePoints,
                targetCells: entry.targetCells,
                plannedPath: entry.plannedPath,
                plannedCost: entry.plannedCost,
                activePlanner,
            })
            if (progressError) {
                errors.push(`${layoutName}: ${progressError}`)
            }
        }

        if (errors.length > 0) {
            setMessage(`Some boards could not be updated: ${errors.join(" ")}`)
        }
        notifyPlansReplaced()
    }

    const optimizeAll = () => {
        setMessage("")
        setWarning("")
        setProgress(null)

        let priorities: ReturnType<typeof readAbilityPriorities>
        let minimums: ReturnType<typeof readAbilityMinimums>
        let maximums: ReturnType<typeof readAbilityMaximums>
        try {
            priorities = readAbilityPriorities(classPreset)
            minimums = resolveAbilityMinimums(
                classPreset,
                priorities,
                readAbilityMinimums(classPreset),
            )
            maximums = readAbilityMaximums(classPreset)
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Could not load class ability priorities.",
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
            worker.onmessage = (event: MessageEvent<PriorityWorkerMessage>) => {
                if (event.data.type === "progress") {
                    setProgress(event.data.progress)
                    return
                }

                finish(worker)
                if (event.data.type === "error") {
                    setMessage(event.data.message)
                    return
                }

                try {
                    const entries = recordPlans(event.data.plans)
                    onComplete(() => applyPlans(entries))
                    const { shortfalls } = event.data
                    if (shortfalls.length > 0) {
                        setWarning(
                            `Not enough points for every minimum: ${shortfalls
                                .map(
                                    (shortfall) =>
                                        `${shortfall.name} +${shortfall.achieved} of +${shortfall.required}`,
                                )
                                .join(", ")}.`,
                        )
                    }
                } catch (error) {
                    setMessage(
                        error instanceof Error
                            ? `Plans were found but could not be saved: ${error.message}`
                            : "Plans were found but could not be saved.",
                    )
                }
            }
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
                classPreset,
                priorities,
                minimums,
                maximums,
                pointBudget: totalPoints,
                timeBudgetMs: searchSeconds * 1000,
            })
        } catch (error) {
            workerRef.current?.terminate()
            workerRef.current = null
            setIsOptimizing(false)
            setMessage(
                error instanceof Error
                    ? error.message
                    : "The all-board priority optimizer could not start.",
            )
        }
    }

    const cancel = () => {
        workerRef.current?.terminate()
        workerRef.current = null
        setIsOptimizing(false)
        setProgress(null)
        setWarning("")
        setMessage("All-board optimization cancelled.")
    }

    return (
        <Flex direction="column" gap="2">
            {isOptimizing ? (
                <Flex direction="column" gap="2">
                    <Flex alignItems="center" gap="3">
                        <Text
                            color="app.muted"
                            flex="1"
                            fontSize="sm"
                            role="status"
                        >
                            {progress
                                ? `Searching… ${Math.floor(progress.elapsedMs / 1000)}s of ${progress.timeBudgetMs / 1000}s · ${progress.pointsUsed} points used`
                                : "Preparing all-board optimization…"}
                        </Text>
                        <SecondaryButton onClick={cancel} size="sm">
                            Cancel
                        </SecondaryButton>
                    </Flex>
                    <Box
                        background="app.inset"
                        height="1.5"
                        overflow="hidden"
                        rounded="full"
                    >
                        <Box
                            background="app.accent"
                            height="100%"
                            transition="width 0.25s linear"
                            width={`${progress ? (progress.elapsedMs / progress.timeBudgetMs) * 100 : 0}%`}
                        />
                    </Box>
                </Flex>
            ) : (
                <Flex gap="2">
                    <PrimaryButton
                        disabled={totalPoints <= 0}
                        flex="1"
                        onClick={optimizeAll}
                    >
                        Optimize all boards
                    </PrimaryButton>
                    <SearchTimeSelect
                        onChange={setSearchSeconds}
                        value={searchSeconds}
                    />
                </Flex>
            )}
            {message && (
                <Text color="app.muted" fontSize="sm" role="status">
                    {message}
                </Text>
            )}
            {warning && (
                <Text color="app.danger" fontSize="sm" role="alert">
                    {warning}
                </Text>
            )}
        </Flex>
    )
}
