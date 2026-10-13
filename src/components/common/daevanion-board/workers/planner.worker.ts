import type { Position } from "../config/boardConfig"
import { findPlannerPath, type PlannerProgress } from "../logic/plannerLogic"
import type { BoardLayout } from "../config/layouts"

type OptimizeMessage = {
    layout: BoardLayout
    start: Position
    targets: string[]
    timeBudgetMs: number
}

globalThis.addEventListener(
    "message",
    (event: MessageEvent<OptimizeMessage>) => {
        const { layout, start, targets, timeBudgetMs } = event.data

        void findPlannerPath(layout, start, new Set(targets), timeBudgetMs, {
            onProgress: (progress: PlannerProgress) => {
                globalThis.postMessage({ type: "progress", progress })
            },
            onBest: (result) => {
                globalThis.postMessage({
                    type: "candidate",
                    result: {
                        ok: true,
                        path: [...result.path],
                        cost: result.cost,
                    },
                })
            },
        })
            .then((result) => {
                if (result.ok) {
                    globalThis.postMessage({
                        type: "candidate",
                        result: {
                            ok: true,
                            path: [...result.path],
                            cost: result.cost,
                        },
                    })
                }
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
                globalThis.postMessage({ type: "error", message })
            })
    },
)
