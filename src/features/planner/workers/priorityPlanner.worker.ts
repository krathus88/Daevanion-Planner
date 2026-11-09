import type { MainBoardId } from "@config/boards"
import type { ClassPreset } from "@config/classPresets"
import { MAX_SEARCH_MS } from "@planner/config/searchTime"
import { searchArielRoute } from "@planner/logic/arielRoute"
import {
    optimizePriorityPlans,
    type PriorityPlannerProgress,
} from "@planner/logic/priorityPlanner"
import type { ArielSettings } from "@planner/storage/arielSettings"
import type { RankOrder } from "@planner/storage/rankOrder"
import type {
    SpecialPriorities,
    SpecialSkips,
} from "@planner/storage/specialPriorities"
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
    specialSkips: SpecialSkips
    rankOrder: RankOrder
    pointBudget: number
    // Each phase ends once this long passes without a better plan.
    stallMs: number
    statSettings: StatSettings
    arielSettings: ArielSettings
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
        specialSkips,
        rankOrder,
        pointBudget,
        stallMs,
        statSettings,
        arielSettings,
        boards,
    } = message
    // Ariel has its own points, so its search runs alongside the main
    // boards' (both yield to each other) and ends on its own stall window.
    const ariel = searchArielRoute(arielSettings, {
        maxMs: MAX_SEARCH_MS,
        stallMs: stallMs,
        shouldStop: shouldStop,
    })
    const main = optimizePriorityPlans(
        classPreset,
        priorities,
        minimums,
        maximums,
        specialPriorities,
        specialSkips,
        rankOrder,
        pointBudget,
        { stallMs: stallMs, shouldStop: shouldStop },
        statSettings,
        (progress: PriorityPlannerProgress) => {
            globalThis.postMessage({ type: "progress", progress: progress })
        },
        boards,
    )
    void Promise.all([main, ariel])
        .then(([{ plans, shortfalls, specialNodes, finds }, arielPlan]) =>
            globalThis.postMessage({
                type: "done",
                plans: plans,
                ariel: arielPlan,
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
