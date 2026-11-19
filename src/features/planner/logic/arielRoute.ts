import type { StatBoardId } from "@config/boards"
import type { StatBoardNode } from "@config/stats/stats"
import { getStart, keyOf } from "@planner/config/boardConfig"
import { layouts } from "@planner/config/layouts"
import {
    statNodeTier,
    statNodeTierValue,
    statWeights,
    type ArielRankOrder,
    type StatBoardTiers,
} from "@planner/config/stats"
import type { StatBoardSettings } from "@planner/storage/statBoardSettings"
import { nodeCost, positionOf } from "./boardLogic"
import type { SearchLimit } from "./plannerLogic"
import { searchStatFill } from "./statFillSearch"

// Each group's level, Ignore for the ones clicked off.
export const arielOrder = (
    settings: Pick<StatBoardSettings, "order" | "ignoredGroups">,
): ArielRankOrder => {
    const order = { ...settings.order }
    for (const group of settings.ignoredGroups) {
        order[group] = "ignore"
    }

    return order
}

// Each stat's tier, Ignore for the ones clicked off.
export const arielTiers = (
    settings: Pick<StatBoardSettings, "tiers" | "ignored">,
): StatBoardTiers => {
    const tiers = { ...settings.tiers }
    for (const stat of settings.ignored) {
        tiers[stat] = "ignore"
    }

    return tiers
}

// The stat board's cells by node kind.
const statNodesOf = (board: StatBoardId) => {
    return Object.entries(layouts[board].nodeStats) as [string, StatBoardNode][]
}

// Per point of the node's cost (every node of a kind costs the same), so
// within a tier the cheapest nodes go first.
export const statNodeValues = (
    board: StatBoardId,
    tiers: StatBoardTiers,
    order: ArielRankOrder,
) => {
    const layout = layouts[board]
    const values: Partial<Record<StatBoardNode, number>> = {}
    for (const [key, node] of statNodesOf(board)) {
        if (values[node] === undefined) {
            values[node] =
                statNodeTierValue(node, tiers, order) /
                nodeCost(layout, positionOf(key))
        }
    }

    return values
}

// Ariel's route for All boards: the same search as This board, until `limit`
// ends it.
export const searchArielRoute = async (
    settings: StatBoardSettings,
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
            statNodeValues("ariel", arielTiers(settings), arielOrder(settings)),
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
export const statMarkedCells = (
    board: StatBoardId,
    tiers: StatBoardTiers,
    order: ArielRankOrder,
) => {
    const layout = layouts[board]
    const best = new Set<string>()
    const good = new Set<string>()
    for (const [key, node] of statNodesOf(board)) {
        if (nodeCost(layout, positionOf(key)) < 2) {
            continue
        }

        const tier = statNodeTier(node, tiers, order)
        if (tier === "best") {
            best.add(key)
        } else if (tier === "good") {
            good.add(key)
        }
    }

    return { best: best, good: good }
}
