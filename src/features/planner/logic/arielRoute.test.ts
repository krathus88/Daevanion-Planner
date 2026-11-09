import { describe, expect, it } from "vitest"
import { getStart, keyOf } from "@planner/config/boardConfig"
import { layouts } from "@planner/config/layouts"
import {
    ARIEL_NODE_GIVES,
    ARIEL_PRIORITY_STATS,
    ARIEL_SPECIAL_STATS,
    type ArielPriorityStat,
} from "@config/stats/stats"
import {
    arielNodeTier,
    DEFAULT_ARIEL_STAT_TIERS,
    type StatTier,
} from "@planner/config/stats"
import type { ArielSettings } from "@planner/storage/arielSettings"
import { arielMarkedCells, arielNodeValues, planArielRoute } from "./arielRoute"
import { nodeCost, positionOf, neighborsOf } from "./boardLogic"

const settings = (points: number): ArielSettings => {
    return { points: points, tiers: DEFAULT_ARIEL_STAT_TIERS }
}

// Every stat ignored except the ones given.
const only = (tiers: Partial<Record<ArielPriorityStat, StatTier>>) => {
    const all = {} as Record<ArielPriorityStat, StatTier>

    for (const stat of ARIEL_PRIORITY_STATS) {
        all[stat] = tiers[stat] ?? "ignore"
    }

    return all
}

describe("planArielRoute", () => {
    it("plans nothing without points", () => {
        expect(planArielRoute(settings(0))).toEqual({
            targetCells: [],
            plannedPath: [],
            plannedCost: 0,
        })
    })

    it("stays within the points, leaves out the start and prices the route", () => {
        const route = planArielRoute(settings(60))
        const start = keyOf(getStart(layouts.ariel))
        let cost = 0

        for (const key of route.plannedPath) {
            cost += nodeCost(layouts.ariel, positionOf(key))
        }

        expect(route.plannedCost).toBeLessThanOrEqual(60)
        expect(route.plannedCost).toBe(cost)
        expect(route.plannedPath).not.toContain(start)
        expect(route.plannedPath.length).toBeGreaterThan(0)
    })

    it("stays connected to the start", () => {
        const route = new Set(planArielRoute(settings(60)).plannedPath)
        const start = getStart(layouts.ariel)
        const seen = new Set<string>()
        const queue = [start]

        while (queue.length > 0) {
            for (const next of neighborsOf(queue.pop() ?? start)) {
                const key = keyOf(next)

                if (route.has(key) && !seen.has(key)) {
                    seen.add(key)
                    queue.push(next)
                }
            }
        }

        expect(seen.size).toBe(route.size)
    })

    it("spends nothing when every stat is ignored", () => {
        expect(
            planArielRoute({ points: 60, tiers: only({}) }).plannedCost,
        ).toBe(0)
    })

    it("only reaches out for nodes that give a wanted stat", () => {
        const route = planArielRoute({
            points: 20,
            tiers: only({ "pve-attack": "best" }),
        })
        const taken = new Set([
            keyOf(getStart(layouts.ariel)),
            ...route.plannedPath,
        ])

        expect(route.plannedCost).toBeGreaterThan(0)

        // Every branch ends on a node it went for.
        for (const key of route.plannedPath) {
            const links = neighborsOf(positionOf(key)).filter((next) =>
                taken.has(keyOf(next)),
            )

            if (links.length === 1) {
                expect(
                    ARIEL_NODE_GIVES[layouts.ariel.nodeStats[key]],
                ).toContain("pve-attack")
            }
        }
    })

    it("leaves ignored special nodes out", () => {
        const route = planArielRoute({
            points: 60,
            tiers: only({
                "pve-attack": "best",
                "pve-defense": "best",
                "boss-attack": "best",
            }),
        })

        for (const key of route.plannedPath) {
            expect(ARIEL_SPECIAL_STATS).not.toContain(
                layouts.ariel.nodeStats[key],
            )
        }
    })
})

describe("arielNodeValues", () => {
    it("prices every node of a kind the same", () => {
        const costs = new Map<string, number>()

        for (const [key, node] of Object.entries(layouts.ariel.nodeStats)) {
            const cost = nodeCost(layouts.ariel, positionOf(key))

            expect(costs.get(node) ?? cost).toBe(cost)
            costs.set(node, cost)
        }
    })

    it("counts a combined node for both stats, per point", () => {
        const attackOnly = arielNodeValues(only({ "pve-attack": "best" }))
        const both = arielNodeValues(
            only({ "pve-attack": "best", "pve-defense": "best" }),
        )

        expect(attackOnly["pve-attack"]).toBeGreaterThan(
            attackOnly["pve-attack-defense"] ?? 0,
        )
        expect(attackOnly["pve-defense"]).toBe(0)
        expect(both["pve-attack-defense"]).toBe(both["pve-attack"])
    })

    it("puts a special node ahead of every stat of its tier", () => {
        const values = arielNodeValues(
            only({
                "pve-damage-boost": "best",
                "pve-attack": "best",
                "pve-defense": "best",
            }),
        )

        expect(values["pve-damage-boost"]).toBeGreaterThan(
            (values["pve-attack-defense"] ?? 0) * 100,
        )

        const good = arielNodeValues(
            only({ "pve-damage-tolerance": "good", "pve-attack": "good" }),
        )

        expect(good["pve-damage-tolerance"]).toBeGreaterThan(
            (good["pve-attack"] ?? 0) * 100,
        )
    })

    it("keeps a stat of a higher tier ahead of a special node", () => {
        const values = arielNodeValues(
            only({
                "pve-damage-tolerance": "good",
                "ariel-critical-hit": "best",
            }),
        )

        expect(values["ariel-critical-hit"]).toBeGreaterThan(
            (values["pve-damage-tolerance"] ?? 0) * 100,
        )
    })

    it("takes 3 PvE Damage Boost nodes with 48 points by default, like the game", () => {
        const route = planArielRoute({
            points: 48,
            tiers: DEFAULT_ARIEL_STAT_TIERS,
        })
        const boosts = route.plannedPath.filter((key) => {
            return layouts.ariel.nodeStats[key] === "pve-damage-boost"
        })

        expect(boosts.sort()).toEqual(["0,0", "0,7", "14,7"])
    })

    it("spends on a special node before stats of its tier", () => {
        const route = planArielRoute({
            points: 30,
            tiers: only({
                "pve-damage-boost": "best",
                "pve-attack": "best",
                "boss-attack": "best",
            }),
        })

        expect(
            route.plannedPath.some((key) => {
                return layouts.ariel.nodeStats[key] === "pve-damage-boost"
            }),
        ).toBe(true)
    })

    it("keeps a higher tier ahead whatever the node costs", () => {
        const values = arielNodeValues(
            only({ "pve-damage-boost": "best", "pve-attack": "good" }),
        )

        expect(values["pve-damage-boost"]).toBeGreaterThan(
            (values["pve-attack"] ?? 0) * 100,
        )
    })
})

describe("arielMarkedCells", () => {
    it("marks nodes of 2 points or more by their best stat", () => {
        const marked = arielMarkedCells(DEFAULT_ARIEL_STAT_TIERS)
        const layout = layouts.ariel

        expect(marked.best.size).toBeGreaterThan(0)

        for (const key of marked.best) {
            expect(nodeCost(layout, positionOf(key))).toBeGreaterThanOrEqual(2)
            expect(
                arielNodeTier(layout.nodeStats[key], DEFAULT_ARIEL_STAT_TIERS),
            ).toBe("best")
        }

        for (const key of marked.good) {
            expect(
                arielNodeTier(layout.nodeStats[key], DEFAULT_ARIEL_STAT_TIERS),
            ).toBe("good")
        }
    })

    it("marks a combined node when either of its stats is Best", () => {
        const marked = arielMarkedCells(only({ "pve-defense": "best" }))

        for (const [key, node] of Object.entries(layouts.ariel.nodeStats)) {
            if (node === "pve-attack-defense") {
                expect(marked.best.has(key)).toBe(true)
            }
        }
    })
})
