import { BOARD_IDS, type BoardId } from "@config/boards"
import {
    DEFAULT_TOTAL_POINTS,
    readBoardProgress,
    readPlannerHistory,
    readSavedPlanners,
    readSharedAllocation,
    type SavedPlanner,
    type SharedAllocation,
} from "./boardStorage"

export type PlannerOption = {
    id: string
    label: string
    points: number
}

export type AllocationSnapshot = {
    allocation: SharedAllocation
    planners: Record<BoardId, PlannerOption[]>
    // Each board's current route: which option it matches, and its cost.
    selected: Record<BoardId, string>
    routeCosts: Record<BoardId, number>
    error: string | null
}

const routeOptions = (
    entries: SavedPlanner[],
    prefix: "saved" | "history",
): PlannerOption[] => {
    return entries.flatMap((entry) =>
        entry.plannedCost === null
            ? []
            : [
                  {
                      id: `${prefix}:${entry.id}`,
                      label: `${entry.name} · ${entry.plannedCost} pts`,
                      points: entry.plannedCost,
                  },
              ],
    )
}

// Every board's current route and the routes it could switch to.
export const readAllocationSnapshot = (classId: string): AllocationSnapshot => {
    const storedAllocation = readSharedAllocation(classId)
    const planners = {} as Record<BoardId, PlannerOption[]>
    const selected = {} as Record<BoardId, string>
    const routeCosts = {} as Record<BoardId, number>
    const errors = [storedAllocation.error]

    for (const layout of BOARD_IDS) {
        const progress = readBoardProgress(classId, layout)
        const saved = readSavedPlanners(classId, layout)
        const history = readPlannerHistory(classId, layout)
        errors.push(progress.error, saved.error, history.error)

        const activePlanner = progress.value?.activePlanner
        const plannedCost = progress.value?.plannedCost ?? null
        const hasRoute = plannedCost !== null
        routeCosts[layout] = plannedCost ?? 0
        selected[layout] = activePlanner
            ? `${activePlanner.source}:${activePlanner.id}`
            : hasRoute
              ? "current"
              : ""

        planners[layout] = [
            // A saved or history route is listed under its own name instead.
            ...(hasRoute && !activePlanner
                ? [
                      {
                          id: "current",
                          label: `Unsaved route · ${plannedCost} pts`,
                          points: plannedCost,
                      },
                  ]
                : []),
            ...routeOptions(saved.value ?? [], "saved"),
            ...routeOptions(history.value ?? [], "history"),
        ]
    }

    return {
        allocation: storedAllocation.value ?? {
            totalPoints: DEFAULT_TOTAL_POINTS,
            selectedPlannerIds: {},
        },
        planners: planners,
        selected: selected,
        routeCosts: routeCosts,
        error: errors.filter(Boolean).join(" ") || null,
    }
}
