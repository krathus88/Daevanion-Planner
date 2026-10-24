import { Text } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import type { SavedPlanner } from "@planner/storage/boardStorage"
import { SaveForm } from "@common/SaveForm"
import { SavedList } from "@common/saved-list/SavedList"
import { Section } from "@common/Section"

type PlannerRoutesSectionProps = {
    defaultOpen: boolean
    isHistoryActive: boolean
}

export const PlannerRoutesSection = ({
    defaultOpen,
    isHistoryActive,
}: PlannerRoutesSectionProps) => {
    const { view, changeView, planner } = useBoard()

    const openPlanner = (
        entries: SavedPlanner[],
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

        planner.loadPlanner(entry, source)
    }

    const isActive = (source: "saved" | "history", id: string) => {
        return (
            planner.activePlanner?.source === source &&
            planner.activePlanner.id === id
        )
    }

    const handleLoadSaved = (id: string) => {
        openPlanner(planner.savedPlanners, id, "saved")
    }

    const handleLoadHistory = (id: string) => {
        openPlanner(planner.plannerHistory, id, "history")
    }

    return (
        <Section defaultOpen={defaultOpen} title="Planner routes">
            <SaveForm
                label="Name this route"
                value={planner.plannerSaveName}
                disabled={
                    planner.targetCells.size === 0 || planner.isOptimizing
                }
                onChange={planner.setPlannerSaveName}
                onSave={planner.savePlanner}
            />

            <Section
                variant="sub"
                count={planner.savedPlanners.length}
                defaultOpen={!isHistoryActive}
                title="Saved"
            >
                <SavedList
                    empty="Saved routes show up here."
                    items={planner.savedPlanners.map((saved) => ({
                        id: saved.id,
                        name: saved.name,
                        detail:
                            saved.plannedCost === null
                                ? `${saved.targetCells.length} required nodes`
                                : `${saved.plannedPath.length} nodes · ${saved.plannedCost} points`,
                        active: isActive("saved", saved.id),
                    }))}
                    onDelete={planner.deletePlanner}
                    onLoad={handleLoadSaved}
                    onRename={planner.renamePlanner}
                />
            </Section>

            <Section
                variant="sub"
                count={planner.plannerHistory.length}
                defaultOpen={isHistoryActive}
                title="Optimizer history"
            >
                {planner.plannerHistory.length > 0 && (
                    <Text textStyle="hint">
                        Keeps the last 25 runs. Use Save as to keep one.
                    </Text>
                )}

                <SavedList
                    empty="Each optimizer run is recorded here."
                    items={planner.plannerHistory.map((entry) => ({
                        id: entry.id,
                        name: entry.name,
                        detail: `${entry.plannedPath.length} nodes · ${entry.plannedCost ?? 0} points`,
                        active: isActive("history", entry.id),
                    }))}
                    loadLabel="Restore"
                    renameLabel="Save as"
                    onDelete={planner.deletePlannerHistoryEntry}
                    onLoad={handleLoadHistory}
                    onRename={planner.keepHistoryEntry}
                />
            </Section>
        </Section>
    )
}
