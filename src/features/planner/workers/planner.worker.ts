import type { StatType } from "@config/stats/stats"
import type { Position } from "@planner/config/boardConfig"
import type { BoardLayout } from "@planner/config/layouts"
import { statWeights, type StatTier } from "@planner/config/stats"
import {
    findPlannerPath,
    type PlannerProgress,
    type PlannerResult,
} from "@planner/logic/plannerLogic"
import { addStatNodes } from "@planner/logic/statFill"

type OptimizeMessage = {
    layout: BoardLayout
    start: Position
    targets: string[]
    timeBudgetMs: number
    statTiers: Record<StatType, StatTier>
    spendLeftover: boolean
    availablePoints: number
}

// Share of the run left for spending leftover points on stats.
const STAT_FILL_SHARE = 0.2

const postCandidate = (
    result: Extract<PlannerResult, { ok: true }>,
    extended = false,
) => {
    globalThis.postMessage({
        type: "candidate",
        result: {
            ok: true,
            path: [...result.path],
            cost: result.cost,
            statScore: result.statScore,
            extended: extended,
        },
    })
}

globalThis.addEventListener(
    "message",
    (event: MessageEvent<OptimizeMessage>) => {
        const {
            layout,
            start,
            targets,
            timeBudgetMs,
            statTiers,
            spendLeftover,
            availablePoints,
        } = event.data
        const startedAt = performance.now()
        const weights = statWeights(layout.nodeStats, statTiers)
        const targetSet = new Set(targets)

        const run = async () => {
            const result = await findPlannerPath(
                layout,
                start,
                targetSet,
                spendLeftover
                    ? timeBudgetMs * (1 - STAT_FILL_SHARE)
                    : timeBudgetMs,
                {
                    onProgress: (progress: PlannerProgress) => {
                        globalThis.postMessage({
                            type: "progress",
                            progress: progress,
                        })
                    },
                    onBest: (best) => postCandidate(best),
                },
                weights,
            )
            if (!result.ok) {
                return result
            }
            postCandidate(result)

            if (!spendLeftover || result.cost >= availablePoints) {
                return result
            }
            return addStatNodes({
                layout: layout,
                start: start,
                targets: targetSet,
                route: result,
                budget: availablePoints,
                weights: weights,
                until: startedAt + timeBudgetMs,
                onImproved: (route) => postCandidate(route, true),
            })
        }

        void run()
            .then((result) => {
                globalThis.postMessage({
                    type: "done",
                    result: result.ok ? { ok: true } : result,
                })
            })
            .catch((error: unknown) => {
                const message =
                    error instanceof Error
                        ? error.message
                        : "The route optimization failed."
                globalThis.postMessage({ type: "error", message: message })
            })
    },
)
