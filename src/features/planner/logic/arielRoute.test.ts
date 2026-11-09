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
    DEFAULT_ARIEL_RANK_ORDER,
    DEFAULT_ARIEL_STAT_TIERS,
    type ArielRankOrder,
    type StatTier,
} from "@planner/config/stats"
import type { ArielSettings } from "@planner/storage/arielSettings"
import {
    arielMarkedCells,
    arielNodeValues,
    arielOrder,
    arielTiers,
    searchArielRoute,
} from "./arielRoute"
import { nodeCost, positionOf, neighborsOf } from "./boardLogic"

// Nothing clicked off unless given; Ignore tiers still count.
type TestSettings = Omit<ArielSettings, "ignored" | "ignoredGroups"> & {
    ignored?: ArielSettings["ignored"]
    ignoredGroups?: ArielSettings["ignoredGroups"]
}

// The greedy fill alone: the search stops before its first try.
const greedyRoute = (settings: TestSettings) => {
    return searchArielRoute(
        { ignored: [], ignoredGroups: [], ...settings },
        {
            maxMs: Number.POSITIVE_INFINITY,
            shouldStop: () => true,
        },
    )
}

const settings = (points: number): ArielSettings => {
    return {
        points: points,
        tiers: DEFAULT_ARIEL_STAT_TIERS,
        ignored: [],
        order: DEFAULT_ARIEL_RANK_ORDER,
        ignoredGroups: [],
    }
}

// Same numbers every run.
const seeded = () => {
    let state = 2
    return () => {
        state = (state * 1103515245 + 12345) % 2 ** 31
        return state / 2 ** 31
    }
}

// Node values with the default same-rank order.
const defaultValues = (tiers: Record<ArielPriorityStat, StatTier>) => {
    return arielNodeValues(tiers, DEFAULT_ARIEL_RANK_ORDER)
}

// Every group Equal except the ones given.
const orderOf = (order: Partial<ArielRankOrder>): ArielRankOrder => {
    return {
        "special-offense": "equal",
        "special-defense": "equal",
        "stat-offense": "equal",
        "stat-defense": "equal",
        ...order,
    }
}

// Every stat ignored except the ones given.
const only = (tiers: Partial<Record<ArielPriorityStat, StatTier>>) => {
    const all = {} as Record<ArielPriorityStat, StatTier>

    for (const stat of ARIEL_PRIORITY_STATS) {
        all[stat] = tiers[stat] ?? "ignore"
    }

    return all
}

describe("searchArielRoute", () => {
    it("plans nothing without points", async () => {
        expect(await greedyRoute(settings(0))).toEqual({
            targetCells: [],
            plannedPath: [],
            plannedCost: 0,
        })
    })

    it("stays within the points, leaves out the start and prices the route", async () => {
        const route = await greedyRoute(settings(60))
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

    it("stays connected to the start", async () => {
        const route = new Set((await greedyRoute(settings(60))).plannedPath)
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

    it("searches past the greedy fill until stopped", async () => {
        let tries = 300
        const route = await searchArielRoute(
            settings(120),
            {
                maxMs: Number.POSITIVE_INFINITY,
                shouldStop: () => {
                    tries -= 1
                    return tries < 0
                },
            },
            seeded(),
        )
        const greedy = await greedyRoute(settings(120))
        const keys = (path: string[]) => {
            return [...path].sort()
        }

        expect(route.plannedCost).toBeLessThanOrEqual(120)
        expect(keys(route.plannedPath)).not.toEqual(keys(greedy.plannedPath))
    })

    it("spends nothing when every stat is ignored", async () => {
        const route = await searchArielRoute(
            {
                points: 60,
                tiers: only({}),
                ignored: [],
                order: DEFAULT_ARIEL_RANK_ORDER,
                ignoredGroups: [],
            },
            { maxMs: Number.POSITIVE_INFINITY },
        )

        expect(route.plannedCost).toBe(0)
    })

    it("only reaches out for nodes that give a wanted stat", async () => {
        const route = await greedyRoute({
            points: 20,
            order: DEFAULT_ARIEL_RANK_ORDER,
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

    it("leaves ignored special nodes out", async () => {
        const route = await greedyRoute({
            points: 60,
            order: DEFAULT_ARIEL_RANK_ORDER,
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
        const attackOnly = defaultValues(only({ "pve-attack": "best" }))
        const both = defaultValues(
            only({ "pve-attack": "best", "pve-defense": "best" }),
        )

        expect(attackOnly["pve-attack"]).toBeGreaterThan(
            attackOnly["pve-attack-defense"] ?? 0,
        )
        expect(attackOnly["pve-defense"]).toBe(0)
        expect(both["pve-attack-defense"]).toBe(both["pve-attack"])
    })

    it("puts a special node ahead of every stat of its tier", () => {
        const values = defaultValues(
            only({
                "pve-damage-boost": "best",
                "pve-attack": "best",
                "pve-defense": "best",
            }),
        )

        // Per point, so whatever the node costs.
        expect(values["pve-damage-boost"]).toBeGreaterThan(
            values["pve-attack-defense"] ?? 0,
        )

        const good = defaultValues(
            only({ "pve-damage-tolerance": "good", "pve-attack": "good" }),
        )

        expect(good["pve-damage-tolerance"]).toBeGreaterThan(
            good["pve-attack"] ?? 0,
        )
    })

    it("keeps a stat of a higher tier ahead of a special node", () => {
        const values = defaultValues(
            only({
                "pve-damage-tolerance": "good",
                "ariel-critical-hit": "best",
            }),
        )

        expect(values["ariel-critical-hit"]).toBeGreaterThan(
            (values["pve-damage-tolerance"] ?? 0) * 100,
        )
    })

    it("takes 4 Damage Boost nodes with 48 points by default", async () => {
        const route = await greedyRoute({
            points: 48,
            order: DEFAULT_ARIEL_RANK_ORDER,
            tiers: DEFAULT_ARIEL_STAT_TIERS,
        })
        const boosts = route.plannedPath.filter((key) => {
            const node = layouts.ariel.nodeStats[key]

            return node === "pve-damage-boost" || node === "boss-damage-boost"
        })

        expect(boosts).toHaveLength(4)
    })

    it("spends on a special node before stats of its tier", async () => {
        const route = await greedyRoute({
            points: 30,
            order: DEFAULT_ARIEL_RANK_ORDER,
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
        const values = defaultValues(
            only({ "pve-damage-boost": "best", "pve-attack": "good" }),
        )

        expect(values["pve-damage-boost"]).toBeGreaterThan(
            (values["pve-attack"] ?? 0) * 100,
        )
    })
})

describe("same-rank order", () => {
    const tiers = only({
        "pve-damage-boost": "best",
        "pve-damage-tolerance": "best",
        "pve-attack": "best",
        "pve-defense": "best",
    })

    it("puts More ahead of Equal ahead of Less, whatever the cost", () => {
        const values = arielNodeValues(
            tiers,
            orderOf({ "special-offense": "less", "stat-offense": "more" }),
        )

        // Damage Boost costs 4 points, Attack 1.
        expect(values["pve-attack"]).toBeGreaterThan(
            (values["pve-damage-tolerance"] ?? 0) * 4,
        )
        expect(values["pve-damage-tolerance"]).toBeGreaterThan(
            (values["pve-damage-boost"] ?? 0) * 4,
        )
    })

    it("splits special nodes and stats into offense and defense", () => {
        const values = arielNodeValues(
            tiers,
            orderOf({ "special-defense": "more", "stat-defense": "more" }),
        )

        expect(values["pve-damage-tolerance"]).toBeGreaterThan(
            (values["pve-damage-boost"] ?? 0) * 4,
        )
        expect(values["pve-defense"]).toBeGreaterThan(
            (values["pve-attack"] ?? 0) * 4,
        )
    })

    it("weighs Equal groups by value per point", () => {
        const values = arielNodeValues(tiers, orderOf({}))

        expect(values["pve-attack"]).toBe(values["pve-defense"])
        // A 4-point Damage Boost node is worth the same as one stat node.
        expect((values["pve-damage-boost"] ?? 0) * 4).toBe(values["pve-attack"])
    })

    it("keeps a higher tier ahead of a lower one set to More", () => {
        const values = arielNodeValues(
            only({ "pve-damage-boost": "good", "pve-attack": "best" }),
            orderOf({ "special-offense": "more", "stat-offense": "less" }),
        )

        expect(values["pve-attack"]).toBeGreaterThan(
            (values["pve-damage-boost"] ?? 0) * 4,
        )
    })

    it("makes an ignored group worth nothing, whatever its tier", () => {
        const values = arielNodeValues(
            tiers,
            orderOf({ "special-offense": "ignore" }),
        )

        expect(values["pve-damage-boost"]).toBe(0)
        expect(values["pve-damage-tolerance"]).toBeGreaterThan(0)
    })

    it("never goes for an ignored group's nodes", async () => {
        const route = await greedyRoute({
            points: 60,
            tiers: tiers,
            order: orderOf({ "stat-offense": "ignore" }),
        })
        const taken = new Set([
            keyOf(getStart(layouts.ariel)),
            ...route.plannedPath,
        ])

        expect(route.plannedCost).toBeGreaterThan(0)

        // Every branch ends on a node worth something.
        for (const key of route.plannedPath) {
            const links = neighborsOf(positionOf(key)).filter((next) =>
                taken.has(keyOf(next)),
            )

            if (links.length === 1) {
                expect(layouts.ariel.nodeStats[key]).not.toBe("pve-attack")
            }
        }
    })

    it("takes stats before special nodes when they come first", async () => {
        const route = await greedyRoute({
            points: 10,
            tiers: tiers,
            order: orderOf({
                "special-offense": "less",
                "special-defense": "less",
            }),
        })

        for (const key of route.plannedPath) {
            expect(ARIEL_SPECIAL_STATS).not.toContain(
                layouts.ariel.nodeStats[key],
            )
        }
    })
})

describe("arielTiers", () => {
    it("gives a clicked-off stat Ignore, keeping the others", () => {
        const tiers = arielTiers({
            tiers: { ...DEFAULT_ARIEL_STAT_TIERS, "pve-attack": "best" },
            ignored: ["pve-attack"],
        })

        expect(tiers["pve-attack"]).toBe("ignore")
        expect(tiers["boss-attack"]).toBe(
            DEFAULT_ARIEL_STAT_TIERS["boss-attack"],
        )
    })

    it("leaves a clicked-off stat off the route", async () => {
        const route = await greedyRoute({
            points: 60,
            tiers: only({ "pve-damage-boost": "best", "pve-attack": "best" }),
            ignored: ["pve-damage-boost"],
            order: DEFAULT_ARIEL_RANK_ORDER,
        })

        expect(route.plannedCost).toBeGreaterThan(0)
        for (const key of route.plannedPath) {
            expect(layouts.ariel.nodeStats[key]).not.toBe("pve-damage-boost")
        }
    })
})

describe("arielOrder", () => {
    it("gives a clicked-off group Ignore, keeping the others' levels", () => {
        const order = arielOrder({
            order: DEFAULT_ARIEL_RANK_ORDER,
            ignoredGroups: ["stat-defense"],
        })

        expect(order["stat-defense"]).toBe("ignore")
        expect(order["stat-offense"]).toBe(
            DEFAULT_ARIEL_RANK_ORDER["stat-offense"],
        )
    })

    it("leaves a clicked-off group off the route", async () => {
        const route = await greedyRoute({
            points: 60,
            tiers: only({ "pve-damage-boost": "best", "pve-attack": "best" }),
            order: DEFAULT_ARIEL_RANK_ORDER,
            ignoredGroups: ["special-offense"],
        })

        expect(route.plannedCost).toBeGreaterThan(0)
        for (const key of route.plannedPath) {
            expect(layouts.ariel.nodeStats[key]).not.toBe("pve-damage-boost")
        }
    })
})

describe("arielMarkedCells", () => {
    it("marks nodes of 2 points or more by their best stat", () => {
        const marked = arielMarkedCells(
            DEFAULT_ARIEL_STAT_TIERS,
            DEFAULT_ARIEL_RANK_ORDER,
        )
        const layout = layouts.ariel

        expect(marked.best.size).toBeGreaterThan(0)

        for (const key of marked.best) {
            expect(nodeCost(layout, positionOf(key))).toBeGreaterThanOrEqual(2)
            expect(
                arielNodeTier(
                    layout.nodeStats[key],
                    DEFAULT_ARIEL_STAT_TIERS,
                    DEFAULT_ARIEL_RANK_ORDER,
                ),
            ).toBe("best")
        }

        for (const key of marked.good) {
            expect(
                arielNodeTier(
                    layout.nodeStats[key],
                    DEFAULT_ARIEL_STAT_TIERS,
                    DEFAULT_ARIEL_RANK_ORDER,
                ),
            ).toBe("good")
        }
    })

    it("marks a combined node when either of its stats is Best", () => {
        const marked = arielMarkedCells(
            only({ "pve-defense": "best" }),
            DEFAULT_ARIEL_RANK_ORDER,
        )

        for (const [key, node] of Object.entries(layouts.ariel.nodeStats)) {
            if (node === "pve-attack-defense") {
                expect(marked.best.has(key)).toBe(true)
            }
        }
    })

    it("leaves out stats of an ignored group", () => {
        const marked = arielMarkedCells(
            only({ "pve-attack": "best", "pve-defense": "best" }),
            orderOf({ "stat-defense": "ignore" }),
        )

        for (const [key, node] of Object.entries(layouts.ariel.nodeStats)) {
            if (node === "pve-defense") {
                expect(marked.best.has(key)).toBe(false)
            }
            if (node === "pve-attack-defense") {
                expect(marked.best.has(key)).toBe(true)
            }
        }
    })
})
