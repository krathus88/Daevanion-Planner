import type { ArielPriorityStat, ArielStatType } from "@config/stats/stats"
import { getStart, keyOf } from "@planner/config/boardConfig"
import { layouts } from "@planner/config/layouts"
import {
    arielNodeTier,
    arielNodeTierValue,
    statWeights,
    type StatTier,
} from "@planner/config/stats"
import type { ArielSettings } from "@planner/storage/arielSettings"
import { nodeCost, positionOf } from "./boardLogic"
import { growByStatValue } from "./statFill"

type ArielTiers = Readonly<Record<ArielPriorityStat, StatTier>>

// Per point of the node's cost (every node of a kind costs the same), so
// within a tier the cheapest nodes go first.
export const arielNodeValues = (tiers: ArielTiers) => {
    const layout = layouts.ariel
    const values: Partial<Record<ArielStatType, number>> = {}
    for (const [key, node] of Object.entries(layout.nodeStats)) {
        if (values[node] === undefined) {
            values[node] =
                arielNodeTierValue(node, tiers) /
                nodeCost(layout, positionOf(key))
        }
    }

    return values
}

export const planArielRoute = (settings: ArielSettings) => {
    const layout = layouts.ariel
    const startKey = keyOf(getStart(layout))
    const grown = growByStatValue({
        layout: layout,
        route: new Set([startKey]),
        cost: 0,
        budget: settings.points,
        weights: statWeights(layout.nodeStats, arielNodeValues(settings.tiers)),
    })
    grown.path.delete(startKey)

    return {
        targetCells: [] as string[],
        plannedPath: [...grown.path],
        plannedCost: grown.cost,
    }
}

// Display only (Best as Need, Good as Prefer, by the node's best stat); the
// route still goes by value.
export const arielMarkedCells = (tiers: ArielTiers) => {
    const layout = layouts.ariel
    const best = new Set<string>()
    const good = new Set<string>()
    for (const [key, node] of Object.entries(layout.nodeStats)) {
        if (nodeCost(layout, positionOf(key)) < 2) {
            continue
        }

        const tier = arielNodeTier(node, tiers)
        if (tier === "best") {
            best.add(key)
        } else if (tier === "good") {
            good.add(key)
        }
    }

    return { best: best, good: good }
}
