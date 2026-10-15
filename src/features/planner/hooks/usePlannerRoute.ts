import { useEffect, useEffectEvent, useState } from "react"
import { keyOf, type Position } from "@planner/config/boardConfig"
import { BOARD_NAMES, type BoardId } from "@config/boards"
import type { BoardLayout } from "@planner/config/layouts"
import {
    clearPlannerUndo,
    keepHistoryRun,
    readBoardProgress,
    readPlannerHistory,
    readPlannerUndo,
    readSavedPlanners,
    subscribeToPlansReplaced,
    writePlannerHistory,
    writePlannerUndo,
    writeSavedPlanners,
    type ActivePlanner,
    type PlannerUndo,
    type SavedPlanner,
} from "@planner/storage/boardStorage"
import type { BoardView } from "../types"
import type { BoardProgressState } from "./useBoardProgress"
import { usePlannerOptimization } from "./usePlannerOptimization"

type UsePlannerRouteOptions = {
    classId: string
    layoutName: BoardId
    layout: BoardLayout
    start: Position
    progress: BoardProgressState
    availablePoints: number
    initialUndo: PlannerUndo | null
    initialSaved: SavedPlanner[]
    initialHistory: SavedPlanner[]
    excludeStart: (keys: string[]) => string[]
    setMessage: (message: string) => void
    setView: (view: BoardView) => void
}

// Planner mode: required nodes, the optimized route through them, undo,
// saved routes and the optimizer history.
export const usePlannerRoute = ({
    classId,
    layoutName,
    layout,
    start,
    progress,
    availablePoints,
    initialUndo,
    initialSaved,
    initialHistory,
    excludeStart,
    setMessage,
    setView,
}: UsePlannerRouteOptions) => {
    const [plannerUndo, setPlannerUndo] = useState(initialUndo)
    const [savedPlanners, setSavedPlanners] = useState(initialSaved)
    const [plannerHistory, setPlannerHistory] = useState(initialHistory)
    const [plannerSaveName, setPlannerSaveName] = useState("")

    const optimization = usePlannerOptimization({
        layout: layout,
        classId: classId,
        layoutName: layoutName,
        start: start,
        targetCells: progress.targetCells,
        plannedPath: progress.plannedPath,
        plannedCost: progress.plannedCost,
        availablePoints: availablePoints,
        plannerHistory: plannerHistory,
        setPlannerHistory: setPlannerHistory,
        setPlannedPath: progress.setPlannedPath,
        setPlannedCost: progress.setPlannedCost,
        setActivePlanner: progress.setActivePlanner,
        persistProgress: progress.persistProgress,
        setMessage: setMessage,
    })

    // "Optimize all boards" and the All boards tab replace routes in
    // storage; reload this board's route when that happens.
    const reloadFromStorage = useEffectEvent(
        (changedLayouts: BoardId[] | undefined) => {
            if (changedLayouts && !changedLayouts.includes(layoutName)) {
                return
            }

            const stored = readBoardProgress(classId, layoutName)
            const undo = readPlannerUndo(classId, layoutName)
            const saved = readSavedPlanners(classId, layoutName)
            const history = readPlannerHistory(classId, layoutName)
            const error = stored.error ?? saved.error ?? history.error
            if (error || !stored.value) {
                setMessage(error ?? "")
                return
            }

            optimization.cancelOptimization()
            progress.setTargetCells(
                new Set(excludeStart(stored.value.targetCells)),
            )
            progress.setPlannedPath(
                new Set(excludeStart(stored.value.plannedPath)),
            )
            progress.setPlannedCost(stored.value.plannedCost)
            progress.setActivePlanner(stored.value.activePlanner ?? null)
            setSavedPlanners(saved.value ?? [])
            setPlannerHistory(history.value ?? [])
            setPlannerUndo(undo.value)
            setView("planner")
            setMessage(
                stored.value.activePlanner
                    ? `Loaded "${stored.value.activePlanner.name}".`
                    : "",
            )
        },
    )

    useEffect(
        () =>
            subscribeToPlansReplaced((changedLayouts) =>
                reloadFromStorage(changedLayouts),
            ),
        [],
    )

    const toggleTarget = (position: Position) => {
        optimization.cancelOptimization()
        const key = keyOf(position)
        if (key === keyOf(start)) {
            setMessage("The start node is the route origin, not a target.")
            return
        }

        const nextTargets = new Set(progress.targetCells)
        if (nextTargets.has(key)) {
            nextTargets.delete(key)
        } else {
            nextTargets.add(key)
        }

        progress.setActivePlanner(null)
        progress.setTargetCells(nextTargets)
        setMessage("")
        progress.setPlannedPath(new Set())
        progress.setPlannedCost(null)
        progress.persistProgress({
            targetCells: [...nextTargets],
            plannedPath: [],
            plannedCost: null,
            activePlanner: null,
        })
    }

    const clearPlanner = () => {
        const undo: PlannerUndo = {
            targetCells: [...progress.targetCells],
            plannedPath: [...progress.plannedPath],
            plannedCost: progress.plannedCost,
        }
        const error = writePlannerUndo(classId, layoutName, undo)
        if (error) {
            setMessage(error)
            return
        }

        optimization.cancelOptimization()
        setPlannerUndo(undo)
        progress.setTargetCells(new Set())
        progress.setPlannedPath(new Set())
        progress.setPlannedCost(null)
        progress.setActivePlanner(null)
        const progressError = progress.persistProgress({
            targetCells: [],
            plannedPath: [],
            plannedCost: null,
            activePlanner: null,
        })
        setMessage(progressError ?? "")
    }

    const restorePlanner = () => {
        if (!plannerUndo) {
            return
        }

        const error = clearPlannerUndo(classId, layoutName)
        if (error) {
            setMessage(error)
            return
        }

        const targets = excludeStart(plannerUndo.targetCells)
        const path = excludeStart(plannerUndo.plannedPath)
        progress.setTargetCells(new Set(targets))
        progress.setPlannedPath(new Set(path))
        progress.setPlannedCost(plannerUndo.plannedCost)
        progress.setActivePlanner(null)
        setPlannerUndo(null)
        const progressError = progress.persistProgress({
            targetCells: targets,
            plannedPath: path,
            plannedCost: plannerUndo.plannedCost,
            activePlanner: null,
        })
        setMessage(progressError ?? "")
    }

    const savePlanner = () => {
        const name = plannerSaveName.trim()
        if (!name) {
            setMessage("Enter a name before saving this planner.")
            return
        }

        const saved: SavedPlanner = {
            id: crypto.randomUUID(),
            name: name,
            createdAt: Date.now(),
            targetCells: [...progress.targetCells],
            plannedPath: [...progress.plannedPath],
            plannedCost: progress.plannedCost,
            availablePoints: availablePoints,
        }
        const nextSavedPlanners = [saved, ...savedPlanners]
        const error = writeSavedPlanners(classId, layoutName, nextSavedPlanners)
        if (error) {
            setMessage(error)
            return
        }

        setSavedPlanners(nextSavedPlanners)
        setPlannerSaveName("")
        const selectedPlanner: ActivePlanner = {
            id: saved.id,
            name: saved.name,
            source: "saved",
        }
        progress.setActivePlanner(selectedPlanner)
        const progressError = progress.persistProgress({
            activePlanner: selectedPlanner,
        })
        setMessage(progressError ?? `Saved "${name}".`)
    }

    const loadPlanner = (
        saved: SavedPlanner,
        source: ActivePlanner["source"],
    ) => {
        optimization.cancelOptimization()
        const targets = excludeStart(saved.targetCells)
        const path = excludeStart(saved.plannedPath)
        progress.setTargetCells(new Set(targets))
        progress.setPlannedPath(new Set(path))
        progress.setPlannedCost(saved.plannedCost)
        const selectedPlanner: ActivePlanner = {
            id: saved.id,
            name: saved.name,
            source: source,
        }
        progress.setActivePlanner(selectedPlanner)
        const error = progress.persistProgress({
            targetCells: targets,
            plannedPath: path,
            plannedCost: saved.plannedCost,
            activePlanner: selectedPlanner,
        })
        setMessage(error ?? `Loaded "${saved.name}".`)
    }

    const deletePlanner = (id: string) => {
        const nextSavedPlanners = savedPlanners.filter(
            (saved) => saved.id !== id,
        )
        const error = writeSavedPlanners(classId, layoutName, nextSavedPlanners)
        if (error) {
            setMessage(error)
            return
        }

        setSavedPlanners(nextSavedPlanners)
        setMessage("Saved planner deleted.")
    }

    const renamePlanner = (id: string, name: string) => {
        const nextSavedPlanners = savedPlanners.map((saved) =>
            saved.id === id ? { ...saved, name: name } : saved,
        )
        const error = writeSavedPlanners(classId, layoutName, nextSavedPlanners)
        if (error) {
            setMessage(error)
            return
        }

        setSavedPlanners(nextSavedPlanners)

        // The board shows the active route's name too.
        const active = progress.activePlanner
        if (active?.source === "saved" && active.id === id) {
            const renamed: ActivePlanner = { ...active, name: name }
            progress.setActivePlanner(renamed)
            const progressError = progress.persistProgress({
                activePlanner: renamed,
            })
            if (progressError) {
                return
            }
        }

        setMessage(`Renamed to "${name}".`)
    }

    // Moves a history entry (with the rest of its all-board run) to Saved.
    const keepHistoryEntry = (id: string, name: string) => {
        const result = keepHistoryRun(classId, layoutName, id, name)
        if ("error" in result) {
            setMessage(result.error)
            return
        }

        setSavedPlanners(readSavedPlanners(classId, layoutName).value ?? [])
        setPlannerHistory(readPlannerHistory(classId, layoutName).value ?? [])
        progress.setActivePlanner(
            readBoardProgress(classId, layoutName).value?.activePlanner ?? null,
        )

        const boardNames = result.boards.map((board) => BOARD_NAMES[board])
        setMessage(
            boardNames.length > 1
                ? `Saved "${name}" on ${boardNames.slice(0, -1).join(", ")} and ${boardNames.at(-1)}.`
                : `Saved "${name}".`,
        )
    }

    const deletePlannerHistoryEntry = (id: string) => {
        const nextHistory = plannerHistory.filter((entry) => entry.id !== id)
        const error = writePlannerHistory(classId, layoutName, nextHistory)
        if (error) {
            setMessage(error)
            return
        }

        setPlannerHistory(nextHistory)
        setMessage("Optimization history entry deleted.")
    }

    return {
        targetCells: progress.targetCells,
        plannedPath: progress.plannedPath,
        plannedCost: progress.plannedCost,
        activePlanner: progress.activePlanner,
        plannerUndo: plannerUndo,
        savedPlanners: savedPlanners,
        plannerHistory: plannerHistory,
        plannerSaveName: plannerSaveName,
        setPlannerSaveName: setPlannerSaveName,
        toggleTarget: toggleTarget,
        clearPlanner: clearPlanner,
        restorePlanner: restorePlanner,
        savePlanner: savePlanner,
        loadPlanner: loadPlanner,
        deletePlanner: deletePlanner,
        renamePlanner: renamePlanner,
        deletePlannerHistoryEntry: deletePlannerHistoryEntry,
        keepHistoryEntry: keepHistoryEntry,
        ...optimization,
    }
}
