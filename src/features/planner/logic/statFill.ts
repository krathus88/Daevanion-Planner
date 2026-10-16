import type { Position } from "@planner/config/boardConfig"
import type { BoardLayout } from "@planner/config/layouts"
import { findPlannerPath, type PlannerResult } from "./plannerLogic"

type FoundRoute = Extract<PlannerResult, { ok: true }>

const STEP_MS = 30
const noProgress = { onBest: () => {}, onProgress: () => {} }

// "Spend leftover points": grows a finished route with stat nodes, best
// weight in `stats` first, while the route stays within `budget`. The
// required targets are always kept, so this never gives up a node the route
// already needed. `weights` break ties between routes of equal cost.
export const addStatNodes = async ({
    layout,
    start,
    targets,
    route,
    budget,
    stats,
    weights,
    until,
    onImproved,
}: {
    layout: BoardLayout
    start: Position
    targets: ReadonlySet<string>
    route: FoundRoute
    budget: number
    stats: ReadonlyMap<string, number>
    weights: ReadonlyMap<string, number>
    until: number
    onImproved: (route: FoundRoute) => void
}) => {
    let current = route
    const extras = new Set<string>()
    const candidates = [...stats.entries()]
        .sort((left, right) => right[1] - left[1])
        .map(([key]) => key)

    for (const key of candidates) {
        if (performance.now() >= until || current.cost >= budget) {
            break
        }
        if (current.path.has(key)) {
            continue
        }

        const result = await findPlannerPath(
            layout,
            start,
            new Set([...targets, ...extras, key]),
            STEP_MS,
            noProgress,
            weights,
        )
        if (result.ok && result.cost <= budget) {
            current = result
            extras.add(key)
            onImproved(result)
        }
    }

    return current
}
