import { useEffect, useEffectEvent, useState } from "react"
import { getStart, type Position } from "../config/boardConfig"
import {
    createInitialSelection,
    selectedNodeCost,
    toggleNodeSelection,
} from "../logic/boardLogic"
import {
    layouts,
    type BoardLayout,
    type BoardLayoutName,
} from "../config/layouts"
import { formatPlannerDuration } from "../logic/plannerLogic"
import type { ClassAbility, ClassPreset } from "../../../../config/classPresets"
import {
    BoardWorkspace,
    type BoardView,
    type SidebarTab,
} from "./BoardWorkspace"
import { usePlannerOptimization } from "../hooks/usePlannerOptimization"
import { useSharedBudget } from "../hooks/useSharedBudget"
import {
    clearBoardUndo,
    clearPlannerUndo,
    readBoardProgress,
    readBoardUndo,
    readPlannerHistory,
    readPlannerUndo,
    readSavedBoards,
    readSavedPlanners,
    subscribeToPlansReplaced,
    writeBoardProgress,
    writeBoardUndo,
    writePlannerUndo,
    writePlannerHistory,
    writeSavedBoards,
    writeSavedPlanners,
    type ActivePlanner,
    type BoardProgress,
    type BoardUndo,
    type PlannerUndo,
    type SavedBoard,
    type SavedPlanner,
} from "../storage/boardStorage"

type DaevanionBoardProps = {
    layout: BoardLayoutName
    classPreset: ClassPreset
    sidebarTab: SidebarTab
    onSidebarTabChange: (tab: SidebarTab) => void
    view: BoardView
    onViewChange: (view: BoardView) => void
}

type BoardInstanceProps = {
    layout: BoardLayout
    layoutName: BoardLayoutName
    classPreset: ClassPreset
    sidebarTab: SidebarTab
    onSidebarTabChange: (tab: SidebarTab) => void
    view: BoardView
    onViewChange: (view: BoardView) => void
}

export const DaevanionBoard = ({
    layout,
    classPreset,
    sidebarTab,
    onSidebarTabChange,
    view,
    onViewChange,
}: DaevanionBoardProps) => (
    <BoardInstance
        key={`${layout}-${classPreset.id}`}
        classPreset={classPreset}
        layout={layouts[layout]}
        layoutName={layout}
        onSidebarTabChange={onSidebarTabChange}
        sidebarTab={sidebarTab}
        onViewChange={onViewChange}
        view={view}
    />
)

const BoardInstance = ({
    layout,
    layoutName,
    classPreset,
    sidebarTab,
    onSidebarTabChange,
    view,
    onViewChange,
}: BoardInstanceProps) => {
    const start = getStart(layout)
    const startKey = `${start.row},${start.column}`
    const excludeStart = (keys: string[]) =>
        keys.filter((key) => key !== startKey)
    const [initialStorage] = useState(() => ({
        progress: readBoardProgress(classPreset.id, layoutName),
        boardUndo: readBoardUndo(classPreset.id, layoutName),
        plannerUndo: readPlannerUndo(classPreset.id, layoutName),
        plannerHistory: readPlannerHistory(classPreset.id, layoutName),
        savedBoards: readSavedBoards(classPreset.id, layoutName),
        savedPlanners: readSavedPlanners(classPreset.id, layoutName),
    }))
    // Planner/Manual mode is kept by the page so it survives board switches.
    const setView = onViewChange
    const [selectedCells, setSelectedCells] = useState(
        () =>
            new Set(
                excludeStart(
                    initialStorage.progress.value?.selectedCells ?? [],
                ),
            ),
    )
    const [targetCells, setTargetCells] = useState(
        () =>
            new Set(
                excludeStart(initialStorage.progress.value?.targetCells ?? []),
            ),
    )
    const [plannedPath, setPlannedPath] = useState(
        () =>
            new Set(
                excludeStart(initialStorage.progress.value?.plannedPath ?? []),
            ),
    )
    const [plannedCost, setPlannedCost] = useState(
        () => initialStorage.progress.value?.plannedCost ?? null,
    )
    const [activePlanner, setActivePlanner] = useState<ActivePlanner | null>(
        () => initialStorage.progress.value?.activePlanner ?? null,
    )
    const [message, setMessage] = useState(() =>
        [
            initialStorage.progress.error,
            initialStorage.boardUndo.error,
            initialStorage.plannerUndo.error,
            initialStorage.plannerHistory.error,
            initialStorage.savedBoards.error,
            initialStorage.savedPlanners.error,
        ]
            .filter(Boolean)
            .join(" "),
    )
    const { totalPoints, usedByOtherBoards, availablePoints, setTotalPoints } =
        useSharedBudget(classPreset.id, layoutName)
    const [boardUndo, setBoardUndo] = useState<BoardUndo | null>(
        initialStorage.boardUndo.value,
    )
    const [plannerUndo, setPlannerUndo] = useState<PlannerUndo | null>(
        initialStorage.plannerUndo.value,
    )
    const [savedBoards, setSavedBoards] = useState<SavedBoard[]>(
        () => initialStorage.savedBoards.value ?? [],
    )
    const [savedPlanners, setSavedPlanners] = useState<SavedPlanner[]>(
        () => initialStorage.savedPlanners.value ?? [],
    )
    const [plannerHistory, setPlannerHistory] = useState<SavedPlanner[]>(
        () => initialStorage.plannerHistory.value ?? [],
    )
    const [boardSaveName, setBoardSaveName] = useState("")
    const [plannerSaveName, setPlannerSaveName] = useState("")
    const spentPoints = selectedNodeCost(layout, selectedCells)
    const remainingPoints = availablePoints - spentPoints
    const selectedForView = view === "planner" ? plannedPath : selectedCells
    const abilitiesById = new Map(
        classPreset.abilities.map((ability) => [ability.id, ability]),
    )
    const abilitiesByPosition: Record<string, ClassAbility> = {}
    for (const [key, abilityId] of Object.entries(
        classPreset.assignments[layoutName] ?? {},
    )) {
        const [rowText, columnText] = key.split(",")
        const row = Number(rowText)
        const column = Number(columnText)
        const kind =
            Number.isInteger(row) && Number.isInteger(column)
                ? layout.grid[row]?.[column]
                : undefined
        const nodeAppearance =
            kind === "S"
                ? layout.startNode
                : kind && Object.hasOwn(layout.specialNodes, kind)
                  ? layout.specialNodes[kind]
                  : layout.mainNode
        const ability = abilitiesById.get(abilityId)

        if (
            !kind ||
            !ability ||
            (nodeAppearance.type !== "skill" &&
                nodeAppearance.type !== "passive") ||
            ability.type !== nodeAppearance.type
        ) {
            throw new Error(
                `Invalid ${classPreset.name} ability assignment at ${layoutName} ${key}. Assign a configured ability to a matching skill or passive node.`,
            )
        }

        abilitiesByPosition[key] = ability
    }
    for (const key of Object.keys(layout.nodeStats)) {
        const [row, column] = key.split(",").map(Number)
        const kind = layout.grid[row]?.[column]
        if (kind !== "#") {
            throw new Error(
                `Invalid stat at ${layoutName} ${key} in layouts.ts: that position is ${
                    kind === undefined || kind === "."
                        ? "not a node"
                        : "not a stat node"
                }. Only stat nodes ("#") can have a stat.`,
            )
        }
    }
    for (const key of Object.keys(layout.specialNodeBonuses)) {
        const [row, column] = key.split(",").map(Number)
        const kind = layout.grid[row]?.[column]
        if (
            kind === undefined ||
            layout.specialNodes[kind]?.type !== "special"
        ) {
            throw new Error(
                `Invalid special node bonus at ${layoutName} ${key} in layouts.ts: that position is ${
                    kind === undefined || kind === "."
                        ? "not a node"
                        : "not a special node"
                }. Only special nodes can have a special node bonus.`,
            )
        }
    }
    const persistProgress = (updates: Partial<BoardProgress> = {}) => {
        const progress: BoardProgress = {
            selectedCells: [...selectedCells],
            availablePoints,
            targetCells: [...targetCells],
            plannedPath: [...plannedPath],
            plannedCost,
            activePlanner,
            ...updates,
        }
        const error = writeBoardProgress(classPreset.id, layoutName, progress)
        if (error) {
            setMessage(error)
        }

        return error
    }

    const {
        isOptimizing,
        optimizationProgress,
        optimizePlanner,
        cancelOptimization,
    } = usePlannerOptimization({
        layout,
        classId: classPreset.id,
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
    })

    const reloadPlannerFromStorage = useEffectEvent(
        (changedLayouts: BoardLayoutName[] | undefined) => {
            if (changedLayouts && !changedLayouts.includes(layoutName)) {
                return
            }

            const progress = readBoardProgress(classPreset.id, layoutName)
            const undo = readPlannerUndo(classPreset.id, layoutName)
            const saved = readSavedPlanners(classPreset.id, layoutName)
            const history = readPlannerHistory(classPreset.id, layoutName)
            const error = progress.error ?? saved.error ?? history.error
            if (error || !progress.value) {
                setMessage(error ?? "")
                return
            }

            cancelOptimization()
            setTargetCells(new Set(excludeStart(progress.value.targetCells)))
            setPlannedPath(new Set(excludeStart(progress.value.plannedPath)))
            setPlannedCost(progress.value.plannedCost)
            setActivePlanner(progress.value.activePlanner ?? null)
            setSavedPlanners(saved.value ?? [])
            setPlannerHistory(history.value ?? [])
            setPlannerUndo(undo.value)
            setView("planner")
            setMessage(
                progress.value.activePlanner
                    ? `Loaded "${progress.value.activePlanner.name}".`
                    : "",
            )
        },
    )

    useEffect(
        () =>
            subscribeToPlansReplaced((changedLayouts) =>
                reloadPlannerFromStorage(changedLayouts),
            ),
        [],
    )

    const updateTotalPoints = (value: number) => {
        const error = setTotalPoints(value)
        if (error) {
            setMessage(error)
        }
    }

    const interactWithCell = (position: Position) => {
        const result = toggleNodeSelection(
            layout,
            start,
            selectedCells,
            position,
            remainingPoints,
        )
        const error = persistProgress({
            selectedCells: [...result.selectedCells],
        })
        setSelectedCells(result.selectedCells)
        setMessage(error ?? result.message)
    }

    const togglePlannerTarget = (position: Position) => {
        cancelOptimization()
        const key = `${position.row},${position.column}`
        if (key === `${start.row},${start.column}`) {
            setMessage("The start node is the route origin, not a target.")
            return
        }

        const nextTargets = new Set(targetCells)
        setActivePlanner(null)
        if (nextTargets.has(key)) {
            nextTargets.delete(key)
            setTargetCells(nextTargets)
            setMessage("")
        } else {
            nextTargets.add(key)
            setTargetCells(nextTargets)
            setMessage("")
        }

        setPlannedPath(new Set())
        setPlannedCost(null)
        persistProgress({
            targetCells: [...nextTargets],
            plannedPath: [],
            plannedCost: null,
            activePlanner: null,
        })
    }

    const resetSelection = () => {
        const undo: BoardUndo = { selectedCells: [...selectedCells] }
        const undoError = writeBoardUndo(classPreset.id, layoutName, undo)
        if (undoError) {
            setMessage(undoError)
            return
        }

        setBoardUndo(undo)
        setSelectedCells(createInitialSelection())
        const progressError = persistProgress({ selectedCells: [] })
        setMessage(progressError ?? "")
    }

    const restoreSelection = () => {
        if (!boardUndo) {
            return
        }

        const error = clearBoardUndo(classPreset.id, layoutName)
        if (error) {
            setMessage(error)
            return
        }

        setSelectedCells(new Set(excludeStart(boardUndo.selectedCells)))
        setBoardUndo(null)
        const progressError = persistProgress({
            selectedCells: excludeStart(boardUndo.selectedCells),
        })
        setMessage(progressError ?? "")
    }

    const clearPlanner = () => {
        const undo: PlannerUndo = {
            targetCells: [...targetCells],
            plannedPath: [...plannedPath],
            plannedCost,
        }
        const error = writePlannerUndo(classPreset.id, layoutName, undo)
        if (error) {
            setMessage(error)
            return
        }

        cancelOptimization()
        setPlannerUndo(undo)
        setTargetCells(new Set())
        setPlannedPath(new Set())
        setPlannedCost(null)
        setActivePlanner(null)
        const progressError = persistProgress({
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

        const error = clearPlannerUndo(classPreset.id, layoutName)
        if (error) {
            setMessage(error)
            return
        }

        setTargetCells(new Set(excludeStart(plannerUndo.targetCells)))
        setPlannedPath(new Set(excludeStart(plannerUndo.plannedPath)))
        setPlannedCost(plannerUndo.plannedCost)
        setActivePlanner(null)
        setPlannerUndo(null)
        const progressError = persistProgress({
            targetCells: excludeStart(plannerUndo.targetCells),
            plannedPath: excludeStart(plannerUndo.plannedPath),
            plannedCost: plannerUndo.plannedCost,
            activePlanner: null,
        })
        setMessage(progressError ?? "")
    }

    const saveBoard = () => {
        const name = boardSaveName.trim()
        if (!name) {
            setMessage("Enter a name before saving this board.")
            return
        }

        const saved: SavedBoard = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            selectedCells: [...selectedCells],
            availablePoints,
        }
        const nextSavedBoards = [saved, ...savedBoards]
        const error = writeSavedBoards(
            classPreset.id,
            layoutName,
            nextSavedBoards,
        )
        if (error) {
            setMessage(error)
            return
        }

        setSavedBoards(nextSavedBoards)
        setBoardSaveName("")
        setMessage(`Saved "${name}".`)
    }

    const savePlanner = () => {
        const name = plannerSaveName.trim()
        if (!name) {
            setMessage("Enter a name before saving this planner.")
            return
        }

        const saved: SavedPlanner = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            targetCells: [...targetCells],
            plannedPath: [...plannedPath],
            plannedCost,
            availablePoints,
        }
        const nextSavedPlanners = [saved, ...savedPlanners]
        const error = writeSavedPlanners(
            classPreset.id,
            layoutName,
            nextSavedPlanners,
        )
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
        setActivePlanner(selectedPlanner)
        const progressError = persistProgress({
            activePlanner: selectedPlanner,
        })
        setMessage(progressError ?? `Saved "${name}".`)
    }

    const loadBoard = (saved: SavedBoard) => {
        cancelOptimization()
        setSelectedCells(new Set(excludeStart(saved.selectedCells)))
        const error = persistProgress({
            selectedCells: excludeStart(saved.selectedCells),
        })
        setMessage(error ?? `Loaded "${saved.name}".`)
    }

    const loadPlanner = (
        saved: SavedPlanner,
        source: ActivePlanner["source"],
    ) => {
        cancelOptimization()
        setTargetCells(new Set(excludeStart(saved.targetCells)))
        setPlannedPath(new Set(excludeStart(saved.plannedPath)))
        setPlannedCost(saved.plannedCost)
        const selectedPlanner = {
            id: saved.id,
            name: saved.name,
            source,
        } satisfies ActivePlanner
        setActivePlanner(selectedPlanner)
        const error = persistProgress({
            targetCells: excludeStart(saved.targetCells),
            plannedPath: excludeStart(saved.plannedPath),
            plannedCost: saved.plannedCost,
            activePlanner: selectedPlanner,
        })
        setMessage(error ?? `Loaded "${saved.name}".`)
    }

    const deleteBoard = (id: string) => {
        const nextSavedBoards = savedBoards.filter((saved) => saved.id !== id)
        const error = writeSavedBoards(
            classPreset.id,
            layoutName,
            nextSavedBoards,
        )
        if (error) {
            setMessage(error)
            return
        }

        setSavedBoards(nextSavedBoards)
        setMessage("Saved board deleted.")
    }

    const deletePlanner = (id: string) => {
        const nextSavedPlanners = savedPlanners.filter(
            (saved) => saved.id !== id,
        )
        const error = writeSavedPlanners(
            classPreset.id,
            layoutName,
            nextSavedPlanners,
        )
        if (error) {
            setMessage(error)
            return
        }

        setSavedPlanners(nextSavedPlanners)
        setMessage("Saved planner deleted.")
    }

    const deletePlannerHistoryEntry = (id: string) => {
        const nextHistory = plannerHistory.filter((entry) => entry.id !== id)
        const error = writePlannerHistory(
            classPreset.id,
            layoutName,
            nextHistory,
        )
        if (error) {
            setMessage(error)
            return
        }

        setPlannerHistory(nextHistory)
        setMessage("Optimization history entry deleted.")
    }

    const changeView = (nextView: BoardView) => {
        cancelOptimization()
        setView(nextView)
        setMessage("")
    }

    const handleCellSelect = (position: Position) => {
        if (view === "planner") {
            togglePlannerTarget(position)
            return
        }

        interactWithCell(position)
    }

    return (
        <BoardWorkspace
            layout={layout}
            view={view}
            changeView={changeView}
            remainingPoints={remainingPoints}
            abilitiesByPosition={abilitiesByPosition}
            handleCellSelect={handleCellSelect}
            selectedForView={selectedForView}
            targetCells={targetCells}
            classPreset={classPreset}
            selectedCells={selectedCells}
            spentPoints={spentPoints}
            availablePoints={availablePoints}
            totalPoints={totalPoints}
            usedByOtherBoards={usedByOtherBoards}
            updateTotalPoints={updateTotalPoints}
            boardSaveName={boardSaveName}
            setBoardSaveName={setBoardSaveName}
            saveBoard={saveBoard}
            resetSelection={resetSelection}
            boardUndo={boardUndo}
            restoreSelection={restoreSelection}
            savedBoards={savedBoards}
            loadBoard={loadBoard}
            deleteBoard={deleteBoard}
            isOptimizing={isOptimizing}
            optimizePlanner={optimizePlanner}
            plannedCost={plannedCost}
            cancelOptimization={cancelOptimization}
            clearPlanner={clearPlanner}
            plannerUndo={plannerUndo}
            restorePlanner={restorePlanner}
            activePlanner={activePlanner}
            plannerSaveName={plannerSaveName}
            setPlannerSaveName={setPlannerSaveName}
            savePlanner={savePlanner}
            savedPlanners={savedPlanners}
            loadPlanner={loadPlanner}
            deletePlanner={deletePlanner}
            plannerHistory={plannerHistory}
            deletePlannerHistoryEntry={deletePlannerHistoryEntry}
            optimizationProgress={optimizationProgress}
            plannedPath={plannedPath}
            message={message}
            formatPlannerDuration={formatPlannerDuration}
            sidebarTab={sidebarTab}
            changeSidebarTab={onSidebarTabChange}
        />
    )
}
