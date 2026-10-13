import { Flex } from "@chakra-ui/react"
import type { BoardWorkspaceProps } from "./BoardWorkspace"
import { Accordion, SaveForm, SavedList } from "./PanelKit"

export const SavedPanel = (props: BoardWorkspaceProps) => {
    const {
        view,
        changeView,
        targetCells,
        selectedCells,
        isOptimizing,
        activePlanner,
        plannerSaveName,
        setPlannerSaveName,
        savePlanner,
        savedPlanners,
        loadPlanner,
        deletePlanner,
        plannerHistory,
        deletePlannerHistoryEntry,
        boardSaveName,
        setBoardSaveName,
        saveBoard,
        savedBoards,
        loadBoard,
        deleteBoard,
    } = props

    // Loading switches to the matching mode so the result is visible.
    const openPlanner = (
        entries: typeof savedPlanners,
        id: string,
        source: "saved" | "history",
    ) => {
        const entry = entries.find((candidate) => candidate.id === id)
        if (!entry) {
            return
        }
        if (view !== "planner") {
            changeView("planner")
        }
        loadPlanner(entry, source)
    }

    const openBoard = (id: string) => {
        const entry = savedBoards.find((candidate) => candidate.id === id)
        if (!entry) {
            return
        }
        if (view !== "board") {
            changeView("board")
        }
        loadBoard(entry)
    }

    // Open the sections for the current mode, and within planner routes the
    // list holding the active route. Remounting on change re-applies this.
    const isPlanner = view === "planner"
    const isHistoryActive = activePlanner?.source === "history"

    return (
        <Flex
            direction="column"
            gap="3"
            key={`${view}-${activePlanner?.source ?? "none"}`}
        >
            <Accordion defaultOpen={isPlanner} title="Planner routes">
                <SaveForm
                    disabled={targetCells.size === 0 || isOptimizing}
                    label="Name this route"
                    onChange={setPlannerSaveName}
                    onSave={savePlanner}
                    value={plannerSaveName}
                />
                <Accordion
                    count={savedPlanners.length}
                    defaultOpen={!isHistoryActive}
                    title="Saved"
                    variant="sub"
                >
                    <SavedList
                        empty="Saved routes show up here."
                        items={savedPlanners.map((saved) => ({
                            id: saved.id,
                            name: saved.name,
                            detail:
                                saved.plannedCost === null
                                    ? `${saved.targetCells.length} required nodes`
                                    : `${saved.plannedPath.length} nodes · ${saved.plannedCost} points`,
                            active:
                                activePlanner?.source === "saved" &&
                                activePlanner.id === saved.id,
                        }))}
                        onDelete={deletePlanner}
                        onLoad={(id) => openPlanner(savedPlanners, id, "saved")}
                    />
                </Accordion>
                <Accordion
                    count={plannerHistory.length}
                    defaultOpen={isHistoryActive}
                    title="Optimizer history"
                    variant="sub"
                >
                    <SavedList
                        empty="Each optimizer run is recorded here."
                        items={plannerHistory.map((entry) => ({
                            id: entry.id,
                            name: entry.name,
                            detail: `${entry.plannedPath.length} nodes · ${entry.plannedCost ?? 0} points`,
                            active:
                                activePlanner?.source === "history" &&
                                activePlanner.id === entry.id,
                        }))}
                        loadLabel="Restore"
                        onDelete={deletePlannerHistoryEntry}
                        onLoad={(id) =>
                            openPlanner(plannerHistory, id, "history")
                        }
                    />
                </Accordion>
            </Accordion>

            <Accordion
                count={savedBoards.length}
                defaultOpen={!isPlanner}
                title="Manual boards"
            >
                <SaveForm
                    disabled={selectedCells.size === 0}
                    label="Name this board"
                    onChange={setBoardSaveName}
                    onSave={saveBoard}
                    value={boardSaveName}
                />
                <SavedList
                    empty="Boards you pick by hand can be saved here."
                    items={savedBoards.map((saved) => ({
                        id: saved.id,
                        name: saved.name,
                        detail: `${saved.selectedCells.length} nodes`,
                    }))}
                    onDelete={deleteBoard}
                    onLoad={openBoard}
                />
            </Accordion>
        </Flex>
    )
}
