import type { ArielPriorityStat, ArielStatType } from "@config/stats/stats"
import { getStart, keyOf } from "@planner/config/boardConfig"
import { layouts } from "@planner/config/layouts"
import {
    arielNodeTier,
    arielNodeTierValue,
    statWeights,
    type ArielRankOrder,
    type StatTier,
} from "@planner/config/stats"
import type { ArielSettings } from "@planner/storage/arielSettings"
import { nodeCost, positionOf } from "./boardLogic"
import type { SearchLimit } from "./plannerLogic"
import { searchStatFill } from "./statFillSearch"

type ArielTiers = Readonly<Record<ArielPriorityStat, StatTier>>

// Each group's level, Ignore for the ones clicked off.
export const arielOrder = (
    settings: Pick<ArielSettings, "order" | "ignoredGroups">,
): ArielRankOrder => {
    const order = { ...settings.order }
    for (const group of settings.ignoredGroups) {
        order[group] = "ignore"
    }

    return order
}

// Each stat's tier, Ignore for the ones clicked off.
export const arielTiers = (
    settings: Pick<ArielSettings, "tiers" | "ignored">,
): ArielTiers => {
    const tiers = { ...settings.tiers }
    for (const stat of settings.ignored) {
        tiers[stat] = "ignore"
    }

    return tiers
}

// Per point of the node's cost (every node of a kind costs the same), so
// within a tier the cheapest nodes go first.
export const arielNodeValues = (tiers: ArielTiers, order: ArielRankOrder) => {
    const layout = layouts.ariel
    const values: Partial<Record<ArielStatType, number>> = {}
    for (const [key, node] of Object.entries(layout.nodeStats)) {
        if (values[node] === undefined) {
            values[node] =
                arielNodeTierValue(node, tiers, order) /
                nodeCost(layout, positionOf(key))
        }
    }

    return values
}

// Ariel's route for All boards: the same search as This board, until `limit`
// ends it.
export const searchArielRoute = async (
    settings: ArielSettings,
    limit: SearchLimit,
    random?: () => number,
) => {
    if (settings.points === 0) {
        return { targetCells: [] as string[], plannedPath: [], plannedCost: 0 }
    }

    const layout = layouts.ariel
    const startKey = keyOf(getStart(layout))
    const best = await searchStatFill({
        layout: layout,
        startKey: startKey,
        kept: new Set([startKey]),
        route: new Set([startKey]),
        budget: settings.points,
        weights: statWeights(
            layout.nodeStats,
            arielNodeValues(arielTiers(settings), arielOrder(settings)),
        ),
        limit: limit,
        random: random,
        onProgress: () => {},
        onBest: () => {},
    })
    const path = new Set(best.path)
    path.delete(startKey)

    return {
        targetCells: [] as string[],
        plannedPath: [...path],
        plannedCost: best.cost,
    }
}

// Display only (Best as Need, Good as Prefer, by the node's best stat); the
// route still goes by value.
export const arielMarkedCells = (tiers: ArielTiers, order: ArielRankOrder) => {
    const layout = layouts.ariel
    const best = new Set<string>()
    const good = new Set<string>()
    for (const [key, node] of Object.entries(layout.nodeStats)) {
        if (nodeCost(layout, positionOf(key)) < 2) {
            continue
        }

        const tier = arielNodeTier(node, tiers, order)
        if (tier === "best") {
            best.add(key)
        } else if (tier === "good") {
            good.add(key)
        }
    }

    return { best: best, good: good }
}
