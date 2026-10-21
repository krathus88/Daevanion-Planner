import { getStart, keyOf } from "@planner/config/boardConfig"
import { layouts } from "@planner/config/layouts"
import { statWeights } from "@planner/config/stats"
import type { ArielSettings } from "@planner/storage/arielSettings"
import { nodeCost, positionOf } from "./boardLogic"
import { growByStatValue } from "./statFill"

// Ariel's route for Optimize all boards: no required nodes, just the best
// stats its points reach.
export const planArielRoute = (settings: ArielSettings) => {
    const layout = layouts.ariel
    const startKey = keyOf(getStart(layout))
    const grown = growByStatValue({
        layout: layout,
        route: new Set([startKey]),
        cost: 0,
        budget: settings.points,
        weights: statWeights(layout.nodeStats, settings.tiers),
    })
    grown.path.delete(startKey)

    return {
        targetCells: [] as string[],
        plannedPath: [...grown.path],
        plannedCost: grown.cost,
    }
}

// Ariel's 2+ point nodes whose stat is Best or Good, marked on the board
// like Route preferences on the other boards: Best as Need (blue dot), Good
// as Prefer (green ring). Only shown; Find a good path still decides by
// tier.
export const arielMarkedCells = (tiers: ArielSettings["tiers"]) => {
    const layout = layouts.ariel
    const best = new Set<string>()
    const good = new Set<string>()
    for (const [key, stat] of Object.entries(layout.nodeStats)) {
        if (nodeCost(layout, positionOf(key)) < 2) {
            continue
        }

        if (tiers[stat] === "best") {
            best.add(key)
        } else if (tiers[stat] === "good") {
            good.add(key)
        }
    }

    return { best: best, good: good }
}
