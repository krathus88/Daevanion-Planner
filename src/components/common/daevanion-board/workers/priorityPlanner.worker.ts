import type { ClassPreset } from "../../../../config/classPresets"
import {
    optimizePriorityPlans,
    type PriorityPlannerProgress,
} from "../logic/priorityPlanner"
import type { StatSettings } from "../storage/statPriorities"
import type {
    AbilityMaximums,
    AbilityMinimums,
    AbilityPriorities,
} from "../storage/abilityPriorities"

type OptimizeMessage = {
    classPreset: ClassPreset
    priorities: AbilityPriorities
    minimums: AbilityMinimums
    maximums: AbilityMaximums
    pointBudget: number
    timeBudgetMs: number
    statSettings: StatSettings
}

globalThis.addEventListener(
    "message",
    (event: MessageEvent<OptimizeMessage>) => {
        const {
            classPreset,
            priorities,
            minimums,
            maximums,
            pointBudget,
            timeBudgetMs,
            statSettings,
        } = event.data
        void optimizePriorityPlans(
            classPreset,
            priorities,
            minimums,
            maximums,
            pointBudget,
            timeBudgetMs,
            statSettings,
            (progress: PriorityPlannerProgress) => {
                globalThis.postMessage({ type: "progress", progress })
            },
        )
            .then(({ plans, shortfalls, specialNodes }) =>
                globalThis.postMessage({
                    type: "done",
                    plans,
                    shortfalls,
                    specialNodes,
                }),
            )
            .catch((error: unknown) => {
                globalThis.postMessage({
                    type: "error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "The priority planner failed.",
                })
            })
    },
)
