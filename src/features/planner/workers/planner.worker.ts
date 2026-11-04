import type { BoardStat } from "@config/stats/stats"
import { keyOf, type Position } from "@planner/config/boardConfig"
import type { BoardLayout } from "@planner/config/layouts"
import { MAX_SEARCH_MS } from "@planner/config/searchTime"
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
    type SearchLimit,
} from "@planner/logic/plannerLogic"
import { addStatNodes, growByStatValue } from "@planner/logic/statFill"
import { growWithFocus } from "@planner/logic/statFocus"

type StartMessage = {
    type: "start"
    layout: BoardLayout
    start: Position
    targets: string[]
    // The search ends once this long passes without a better route.
    stallMs: number
    statTiers: Partial<Record<BoardStat, StatTier>>
    spendLeftover: boolean
    availablePoints: number
    priorities: PathPriorities
    growStats: boolean
}

// Ends the route search early; leftover stats are still spent.
type StopMessage = { type: "stop" }

let stopRequested = false

const postCandidate = (
    result: Extract<PlannerResult, { ok: true }>,
    startedAt: number,
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
        elapsedMs: performance.now() - startedAt,
    })
}

const postProgress = (progress: PlannerProgress) => {
    globalThis.postMessage({ type: "progress", progress: progress })
}

const optimize = (message: StartMessage) => {
    const {
        layout,
        start,
        targets,
        stallMs,
        statTiers,
        spendLeftover,
        availablePoints,
        priorities,
        growStats,
    } = message
    const startedAt = performance.now()
    const stats = statWeights(layout.nodeStats, statTiers)
    const weights = new Map(priorities.weights)
    const targetSet = new Set(targets)
    const limit: SearchLimit = {
        maxMs: MAX_SEARCH_MS,
        stallMs: stallMs,
        shouldStop: () => {
            return stopRequested
        },
    }

    const runGrowStats = async () => {
        const startKey = keyOf(start)
        const base =
            targetSet.size > 0
                ? await findPlannerPath(
                      layout,
                      start,
                      targetSet,
                      limit,
                      {
                          onProgress: postProgress,
                          onBest: (best) => postCandidate(best, startedAt),
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

        postCandidate(result, startedAt, true)
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
            limit,
            {
                onProgress: postProgress,
                onBest: (best) => postCandidate(best, startedAt),
            },
            weights,
        )
        if (!result.ok) {
            return result
        }
        postCandidate(result, startedAt)

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
                postCandidate(current, startedAt, true)
            }
        }

        if (!spendLeftover || current.cost >= availablePoints) {
            return current
        }

        // One short pass, which a stop doesn't skip.
        return addStatNodes({
            layout: layout,
            start: start,
            targets: kept,
            route: current,
            budget: availablePoints,
            stats: stats,
            weights: weights,
            onImproved: (route) => postCandidate(route, startedAt, true),
        })
    }

    void run()
        .then((result) => {
            globalThis.postMessage({
                type: "done",
                result: result.ok ? { ok: true } : result,
                elapsedMs: performance.now() - startedAt,
            })
        })
        .catch((error: unknown) => {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "The route optimization failed."
            globalThis.postMessage({ type: "error", message: errorMessage })
        })
}

globalThis.addEventListener(
    "message",
    (event: MessageEvent<StartMessage | StopMessage>) => {
        if (event.data.type === "stop") {
            stopRequested = true
            return
        }

        stopRequested = false
        optimize(event.data)
    },
)
