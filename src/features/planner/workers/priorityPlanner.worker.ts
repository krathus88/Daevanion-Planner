import type { MainBoardId } from "@config/boards"
import type { ClassPreset } from "@config/classPresets"
import {
    optimizePriorityPlans,
    type PriorityPlannerProgress,
} from "@planner/logic/priorityPlanner"
import type { RankOrder } from "@planner/storage/rankOrder"
import type { SpecialPriorities } from "@planner/storage/specialPriorities"
import type { StatSettings } from "@planner/storage/statPriorities"
import type {
    AbilityMaximums,
    AbilityMinimums,
    AbilityPriorities,
} from "@planner/storage/abilityPriorities"

type StartMessage = {
    type: "start"
    classPreset: ClassPreset
    priorities: AbilityPriorities
    minimums: AbilityMinimums
    maximums: AbilityMaximums
    specialPriorities: SpecialPriorities
    rankOrder: RankOrder
    pointBudget: number
    // Each phase ends once this long passes without a better plan.
    stallMs: number
    statSettings: StatSettings
    boards?: MainBoardId[]
}

// Ends the search early with the plan it has.
type StopMessage = { type: "stop" }

let stopRequested = false

const shouldStop = () => {
    return stopRequested
}

const optimize = (message: StartMessage) => {
    const {
        classPreset,
        priorities,
        minimums,
        maximums,
        specialPriorities,
        rankOrder,
        pointBudget,
        stallMs,
        statSettings,
        boards,
    } = message
    void optimizePriorityPlans(
        classPreset,
        priorities,
        minimums,
        maximums,
        specialPriorities,
        rankOrder,
        pointBudget,
        { stallMs: stallMs, shouldStop: shouldStop },
        statSettings,
        (progress: PriorityPlannerProgress) => {
            globalThis.postMessage({ type: "progress", progress: progress })
        },
        boards,
    )
        .then(({ plans, shortfalls, specialNodes, finds }) =>
            globalThis.postMessage({
                type: "done",
                plans: plans,
                shortfalls: shortfalls,
                specialNodes: specialNodes,
                finds: finds,
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
