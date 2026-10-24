import type { BoardStat } from "@config/stats/stats"
import { keyOf, type Position } from "@planner/config/boardConfig"
import type { BoardLayout } from "@planner/config/layouts"
import {
    routeStatScore,
    statWeights,
    type StatTier,
} from "@planner/config/stats"
import type { PathPriorities } from "@planner/logic/pathPriorities"
import {
    findPlannerPath,
    type PlannerProgress,
    type PlannerResult,
} from "@planner/logic/plannerLogic"
import { addStatNodes, growByStatValue } from "@planner/logic/statFill"
import { growWithFocus } from "@planner/logic/statFocus"

type OptimizeMessage = {
    layout: BoardLayout
    start: Position
    targets: string[]
    timeBudgetMs: number
    statTiers: Partial<Record<BoardStat, StatTier>>
    spendLeftover: boolean
    availablePoints: number
    priorities: PathPriorities
    growStats: boolean
}

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
            priorities,
            growStats,
        } = event.data
        const startedAt = performance.now()
        const stats = statWeights(layout.nodeStats, statTiers)
        const weights = new Map(priorities.weights)
        const targetSet = new Set(targets)

        const runGrowStats = async () => {
            const startKey = keyOf(start)
            const base =
                targetSet.size > 0
                    ? await findPlannerPath(
                          layout,
                          start,
                          targetSet,
                          timeBudgetMs,
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
                    : {
                          ok: true as const,
                          path: new Set<string>(),
                          cost: 0,
                          statScore: 0,
                      }
            if (!base.ok) {
                return base
            }

            const grown = growByStatValue({
                layout: layout,
                route: new Set([startKey, ...base.path]),
                cost: base.cost,
                budget: availablePoints,
                weights: stats,
            })
            grown.path.delete(startKey)
            const result: Extract<PlannerResult, { ok: true }> = {
                ok: true,
                path: grown.path,
                cost: grown.cost,
                statScore: routeStatScore(grown.path, weights),
            }
            if (result.cost === 0) {
                return {
                    ok: false as const,
                    reason: "No stat node fits in Ariel's points with these priorities.",
                }
            }

            postCandidate(result, true)
            return result
        }

        const run = async () => {
            if (growStats) {
                return runGrowStats()
            }

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

            let current = result
            const kept = new Set(targetSet)
            if (priorities.focusGroups.length > 0) {
                const startKey = keyOf(start)
                const grown = growWithFocus({
                    layout: layout,
                    route: new Set([startKey, ...result.path]),
                    cost: result.cost,
                    budget: availablePoints,
                    groups: priorities.focusGroups,
                })
                if (grown.cost > result.cost) {
                    grown.path.delete(startKey)
                    for (const key of grown.path) {
                        if (!result.path.has(key)) {
                            kept.add(key)
                        }
                    }
                    current = {
                        ok: true,
                        path: grown.path,
                        cost: grown.cost,
                        statScore: routeStatScore(grown.path, weights),
                    }
                    postCandidate(current, true)
                }
            }

            if (!spendLeftover || current.cost >= availablePoints) {
                return current
            }
            return addStatNodes({
                layout: layout,
                start: start,
                targets: kept,
                route: current,
                budget: availablePoints,
                stats: stats,
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
