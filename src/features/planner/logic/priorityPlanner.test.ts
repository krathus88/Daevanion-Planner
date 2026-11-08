import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest"
import { MAIN_BOARD_IDS, type MainBoardId } from "@config/boards"
import {
    CLASS_IDS,
    loadClassPreset,
    type ClassPreset,
} from "@config/classPresets"
import { getStart, keyOf } from "@planner/config/boardConfig"
import { MAX_SEARCH_MS } from "@planner/config/searchTime"
import { layouts } from "@planner/config/layouts"
import {
    defaultAbilityPriorities,
    resolveAbilityMinimums,
} from "@planner/storage/abilityPriorities"
import { DEFAULT_RANK_ORDER } from "@planner/storage/rankOrder"
import { DEFAULT_SPECIAL_PRIORITIES } from "@planner/storage/specialPriorities"
import {
    DEFAULT_STAT_SETTINGS,
    type StatSettings,
} from "@planner/storage/statPriorities"
import { NOTHING_MAXED } from "@test/statSettingsFixture"
import { neighborsOf, nodeCost, positionOf } from "./boardLogic"
import {
    optimizePriorityPlans,
    type PriorityPlannerProgress,
} from "./priorityPlanner"

let preset: ClassPreset

beforeAll(async () => {
    preset = await loadClassPreset("gladiator")
})

// Each read of the clock jumps a second, so every route search stops after one
// attempt and a run is fast and repeatable however busy the machine is.
beforeEach(() => {
    let now = 0

    vi.spyOn(performance, "now").mockImplementation(() => {
        now += 1000

        return now
    })
    vi.spyOn(Math, "random").mockReturnValue(0.99)
})

afterEach(() => {
    vi.restoreAllMocks()
})

type Options = {
    points?: number
    minimums?: Record<string, number>
    maximums?: Record<string, number>
    priorities?: Record<string, number>
    stallMs?: number
    shouldStop?: () => boolean
    statSettings?: StatSettings
    boards?: readonly MainBoardId[]
    onProgress?: (progress: PriorityPlannerProgress) => void
    classPreset?: ClassPreset
}

const optimize = ({
    points = 225,
    minimums = {},
    maximums = {},
    priorities,
    stallMs = 1,
    shouldStop,
    statSettings = DEFAULT_STAT_SETTINGS,
    boards,
    onProgress = () => {},
    classPreset,
}: Options) => {
    const used = classPreset ?? preset

    return optimizePriorityPlans(
        used,
        priorities ?? defaultAbilityPriorities(used),
        minimums,
        maximums,
        DEFAULT_SPECIAL_PRIORITIES,
        DEFAULT_RANK_ORDER,
        points,
        { stallMs: stallMs, shouldStop: shouldStop },
        statSettings,
        onProgress,
        boards,
    )
}

const totalCost = (plans: Record<MainBoardId, { plannedCost: number }>) => {
    return MAIN_BOARD_IDS.reduce((total, board) => {
        return total + plans[board].plannedCost
    }, 0)
}

const abilityNodes = (abilityId: string, board: MainBoardId) => {
    return Object.entries(preset.assignments[board] ?? {})
        .filter(([, id]) => id === abilityId)
        .map(([key]) => key)
}

// A Cleric setup shared by a user: Attack and Crit maxed before rank 5.
const optimizeMaxedCrit = async (points: number, stallMs = 1) => {
    const cleric = await loadClassPreset("cleric")
    const priorities = {
        ...defaultAbilityPriorities(cleric),
        d: 5,
        dm: 4,
        hl: 3,
        jt: 5,
        rr: 3,
        cot: 4,
        lor: 4,
        peg: 1,
        phe: 2,
        piv: 4,
        prb: 3,
        psw: 5,
        pwb: 4,
        pelg: 1,
    }
    const maxCrit = { enabled: true, skillAfter: 4, passiveAfter: 4 }
    const result = await optimize({
        classPreset: cleric,
        priorities: priorities,
        minimums: resolveAbilityMinimums(cleric, priorities, {
            d: 2,
            da: 4,
            er: 4,
            hl: 4,
            jt: 4,
            rr: 4,
            lor: 4,
            phe: 4,
            piv: 4,
            prb: 4,
            pwb: 4,
        }),
        maximums: {
            d: 2,
            dm: 2,
            hl: 4,
            jt: 4,
            cot: 2,
            lor: 4,
            lss: 0,
            phb: 0,
            psw: 4,
            pelb: 0,
            ppoc: 0,
        },
        points: points,
        stallMs: stallMs,
        statSettings: {
            order: [
                "attack",
                "critical-hit",
                "defense",
                "max-hp",
                "critical-hit-resist",
            ],
            tied: ["critical-hit", "max-hp"],
            ignored: ["max-mp"],
            max: {
                ...NOTHING_MAXED.max,
                attack: maxCrit,
                "critical-hit": maxCrit,
            },
        },
    })

    return { cleric: cleric, result: result }
}

const maxedCritNodes = (
    plans: Record<MainBoardId, { plannedPath: string[] }>,
) => {
    return MAIN_BOARD_IDS.reduce((total, board) => {
        return (
            total +
            plans[board].plannedPath.filter((key) => {
                const stat = layouts[board].nodeStats[key]
                return stat === "attack" || stat === "critical-hit"
            }).length
        )
    }, 0)
}

describe("optimizePriorityPlans", () => {
    it("plans nothing with no points", async () => {
        const result = await optimize({ points: 0 })

        expect(totalCost(result.plans)).toBe(0)

        for (const board of MAIN_BOARD_IDS) {
            expect(result.plans[board].plannedPath).toEqual([])
        }
    })

    it.each([30, 100, 225])("stays within a budget of %d", async (points) => {
        const result = await optimize({ points: points })
        const total = totalCost(result.plans)

        expect(total).toBeGreaterThan(0)
        expect(total).toBeLessThanOrEqual(points)
    })

    it("prices each board's route correctly", async () => {
        const result = await optimize({ points: 150 })

        for (const board of MAIN_BOARD_IDS) {
            let cost = 0

            for (const key of result.plans[board].plannedPath) {
                cost += nodeCost(layouts[board], positionOf(key))
            }

            expect(result.plans[board].plannedCost, board).toBe(cost)
        }
    })

    it("keeps every route connected, with its targets on it", async () => {
        const result = await optimize({ points: 150 })

        for (const board of MAIN_BOARD_IDS) {
            const plan = result.plans[board]
            const route = new Set(plan.plannedPath)
            const start = getStart(layouts[board])
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

            expect(seen.size, board).toBe(route.size)

            for (const key of plan.targetCells) {
                expect(route.has(key), `${board} ${key}`).toBe(true)
            }
        }
    })

    it("only touches the boards it's given", async () => {
        const result = await optimize({ boards: ["zikel"] })

        expect(result.plans.zikel.plannedPath.length).toBeGreaterThan(0)
        expect(result.plans.nezekan.plannedPath).toEqual([])
        expect(result.plans.vaizel.plannedCost).toBe(0)
    })

    it("meets a minimum when the budget allows", async () => {
        const ability = preset.abilities[0]
        const result = await optimize({ minimums: { [ability.id]: 2 } })
        let taken = 0

        for (const board of MAIN_BOARD_IDS) {
            const route = new Set(result.plans[board].plannedPath)

            taken += abilityNodes(ability.id, board).filter((key) =>
                route.has(key),
            ).length
        }

        expect(taken).toBeGreaterThanOrEqual(2)
        expect(result.shortfalls).toEqual([])
    })

    it("reports a minimum it couldn't reach", async () => {
        const ability = preset.abilities[0]
        const result = await optimize({
            points: 0,
            minimums: { [ability.id]: 1 },
        })

        expect(result.shortfalls).toEqual([
            {
                abilityId: ability.id,
                name: ability.name,
                required: 1,
                achieved: 0,
            },
        ])
    })

    it("caps a minimum at how many nodes the ability has", async () => {
        const ability = preset.abilities[0]
        const result = await optimize({ minimums: { [ability.id]: 999 } })

        for (const shortfall of result.shortfalls) {
            expect(shortfall.required).toBeLessThan(999)
        }
    })

    it("doesn't target an ability at its maximum", async () => {
        const ability = preset.abilities[0]
        const result = await optimize({ maximums: { [ability.id]: 0 } })

        for (const board of MAIN_BOARD_IDS) {
            const nodes = abilityNodes(ability.id, board)

            for (const key of result.plans[board].targetCells) {
                expect(nodes).not.toContain(key)
            }
        }
    })

    it("favors the top-ranked ability when points are short", async () => {
        const [first, second] = preset.abilities
        const priorities = {
            ...defaultAbilityPriorities(preset),
            [second.id]: 1,
            [first.id]: 50,
        }
        const boards = MAIN_BOARD_IDS.filter((board) => {
            return abilityNodes(second.id, board).length > 0
        })
        const result = await optimize({
            priorities: priorities,
            minimums: { [second.id]: 1 },
            points: 20,
        })

        expect(
            boards.some((board) => {
                return abilityNodes(second.id, board).some((key) =>
                    result.plans[board].plannedPath.includes(key),
                )
            }),
        ).toBe(true)
    })

    it("counts special nodes taken out of the total", async () => {
        const result = await optimize({ points: 150 })
        let total = 0

        for (const board of MAIN_BOARD_IDS) {
            total += Object.keys(layouts[board].specialNodeBonuses).length
        }

        expect(result.specialNodes.total).toBe(total)
        expect(result.specialNodes.taken).toBeGreaterThan(0)
        expect(result.specialNodes.taken).toBeLessThanOrEqual(total)
    })

    it("reports progress, ending at the points used", async () => {
        const onProgress = vi.fn()
        const result = await optimize({ points: 50, onProgress: onProgress })

        expect(onProgress.mock.lastCall?.[0].pointsUsed).toBe(
            totalCost(result.plans),
        )
    })

    // With one attempt per search, refining here never beats the first plan,
    // so improvements after it aren't covered.
    it("reports when the first plan is ready, then keeps counting", async () => {
        const onProgress = vi.fn()
        const result = await optimize({
            points: 100,
            stallMs: 200_000,
            boards: ["zikel"],
            onProgress: onProgress,
        })
        const reports = onProgress.mock.calls.map(
            ([progress]) => progress.finds,
        )
        const firstReady = reports.findIndex(
            (finds) => finds.firstFoundMs !== null,
        )
        const last = reports.at(-1)

        expect(reports[0].firstFoundMs).toBeNull()
        expect(firstReady).toBeGreaterThan(0)
        expect(reports[firstReady].improvements).toBe(0)
        expect(result.finds).toEqual(last)
        expect(reports[0].optionsChecked).toBe(0)
        expect(last.optionsChecked).toBeGreaterThan(
            reports[firstReady].optionsChecked,
        )

        // The count only goes up.
        for (let index = 1; index < reports.length; index += 1) {
            expect(reports[index].improvements).toBeGreaterThanOrEqual(
                reports[index - 1].improvements,
            )
        }
    })

    it("refines until a stall passes without a better plan", async () => {
        const onProgress = vi.fn()
        await optimize({
            points: 100,
            stallMs: 20_000,
            boards: ["zikel"],
            onProgress: onProgress,
        })
        const reports = onProgress.mock.calls.map(([progress]) => progress)
        const last = reports.at(-1)

        expect(reports[0].phase).toBe("build")
        expect(last.phase).toBe("refine")
        expect(last.stallMs).toBe(20_000)
        expect(last.idleMs).toBeGreaterThanOrEqual(20_000)
        expect(last.elapsedMs).toBeLessThan(MAX_SEARCH_MS)
    })

    it("reports progress while a long route search runs", async () => {
        // A slower clock lets each refining search run long enough to report
        // from inside it.
        let now = 0
        vi.spyOn(performance, "now").mockImplementation(() => {
            now += 20

            return now
        })
        const onProgress = vi.fn()
        await optimize({
            points: 100,
            stallMs: 6000,
            boards: ["zikel"],
            onProgress: onProgress,
        })
        const refining = onProgress.mock.calls
            .map(([progress]) => progress)
            .filter((progress) => progress.phase === "refine")
        let longestGap = 0
        for (let index = 1; index < refining.length; index++) {
            const gap =
                refining[index].elapsedMs - refining[index - 1].elapsedMs
            longestGap = Math.max(longestGap, gap)
        }

        expect(refining.length).toBeGreaterThan(1)
        expect(longestGap).toBeLessThan(1000)
    })

    it("caps refining, counted from when it starts", async () => {
        const onProgress = vi.fn()
        await optimize({
            points: 100,
            stallMs: 10 * MAX_SEARCH_MS,
            boards: ["zikel"],
            onProgress: onProgress,
        })
        const last = onProgress.mock.lastCall?.[0]
        const refining = last.elapsedMs - last.finds.firstFoundMs

        expect(last.finds.firstFoundMs).toBeGreaterThan(0)
        expect(refining).toBeGreaterThanOrEqual(MAX_SEARCH_MS)
        expect(refining).toBeLessThan(MAX_SEARCH_MS + 60_000)
    })

    it("stops when asked, keeping the plan", async () => {
        let ready = false
        const onProgress = vi.fn((progress: PriorityPlannerProgress) => {
            ready = progress.finds.firstFoundMs !== null
        })
        const base = {
            points: 150,
            stallMs: 10 * MAX_SEARCH_MS,
            boards: ["nezekan"] as const,
        }
        const plainPlan = await optimize({
            ...base,
            shouldStop: () => ready,
            onProgress: onProgress,
        })
        const elapsed = onProgress.mock.lastCall?.[0].elapsedMs

        expect(plainPlan.plans.nezekan.plannedCost).toBeGreaterThan(0)
        expect(elapsed).toBeLessThan(MAX_SEARCH_MS)
    })

    it("throws on an ability assigned to the wrong node type", async () => {
        const passive = preset.abilities.find(
            (ability) => ability.type === "passive",
        )
        const [skillKey] = Object.entries(
            preset.assignments.nezekan ?? {},
        ).find(([, id]) => {
            return (
                preset.abilities.find((ability) => ability.id === id)?.type ===
                "skill"
            )
        }) as [string, string]

        await expect(
            optimize({
                classPreset: {
                    ...preset,
                    assignments: {
                        ...preset.assignments,
                        nezekan: {
                            ...preset.assignments.nezekan,
                            [skillKey]: passive?.id ?? "",
                        },
                    },
                },
            }),
        ).rejects.toThrow("Invalid Gladiator assignment")
    })

    it("never spends points on stats that aren't maxed", async () => {
        const base = {
            points: 150,
            boards: ["nezekan"] as const,
            stallMs: 3_000_000,
        }
        const ranked = await optimize({ ...base, statSettings: NOTHING_MAXED })
        const ignored = await optimize({
            ...base,
            statSettings: {
                ...NOTHING_MAXED,
                order: [],
                tied: [],
                ignored: [...NOTHING_MAXED.order, ...NOTHING_MAXED.ignored],
            },
        })

        expect(ranked.plans.nezekan.plannedCost).toBe(
            ignored.plans.nezekan.plannedCost,
        )
    })

    it("never targets an ability capped at 0, as a skip does", async () => {
        const [first] = [...preset.abilities].sort(
            (left, right) =>
                (defaultAbilityPriorities(preset)[left.id] ?? 0) -
                (defaultAbilityPriorities(preset)[right.id] ?? 0),
        )
        const result = await optimize({
            points: 225,
            boards: ["nezekan"],
            stallMs: 3_000_000,
            minimums: { [first.id]: 0 },
            maximums: { [first.id]: 0 },
        })
        const nodes = abilityNodes(first.id, "nezekan")

        expect(nodes.length).toBeGreaterThan(0)
        for (const key of nodes) {
            expect(result.plans.nezekan.targetCells).not.toContain(key)
        }
        expect(result.shortfalls).toEqual([])
    })

    it("leaves maxed stat nodes out of the targets", async () => {
        const result = await optimize({
            points: 150,
            boards: ["nezekan"],
            stallMs: 3_000_000,
            statSettings: {
                ...DEFAULT_STAT_SETTINGS,
                max: {
                    ...DEFAULT_STAT_SETTINGS.max,
                    attack: {
                        enabled: true,
                        skillAfter: null,
                        passiveAfter: null,
                    },
                },
            },
        })

        for (const key of result.plans.nezekan.targetCells) {
            expect(layouts.nezekan.nodeStats[key], key).toBeUndefined()
        }
    })

    it("takes maxed stats before lower ranks", async () => {
        const focus: StatSettings = {
            ...DEFAULT_STAT_SETTINGS,
            max: {
                ...DEFAULT_STAT_SETTINGS.max,
                attack: { enabled: true, skillAfter: 1, passiveAfter: 1 },
            },
        }
        const attackNodes = (path: string[]) => {
            return path.filter(
                (key) => layouts.nezekan.nodeStats[key] === "attack",
            ).length
        }
        const base = { points: 60, boards: ["nezekan"] as const }
        const plain = await optimize({
            ...base,
            statSettings: {
                ...DEFAULT_STAT_SETTINGS,
                max: {
                    ...DEFAULT_STAT_SETTINGS.max,
                    attack: { ...focus.max.attack, enabled: false },
                },
            },
        })
        const focused = await optimize({ ...base, statSettings: focus })

        expect(attackNodes(focused.plans.nezekan.plannedPath)).toBeGreaterThan(
            attackNodes(plain.plans.nezekan.plannedPath),
        )
        expect(focused.plans.nezekan.plannedCost).toBeLessThanOrEqual(60)
    })

    it("takes every node of a maxed stat when the points allow", async () => {
        const attackTotal = Object.values(layouts.nezekan.nodeStats).filter(
            (stat) => stat === "attack",
        ).length
        const result = await optimize({
            points: 2000,
            boards: ["nezekan"],
            statSettings: {
                ...DEFAULT_STAT_SETTINGS,
                // Empty ranks wait for every ability.
                max: {
                    ...DEFAULT_STAT_SETTINGS.max,
                    attack: {
                        enabled: true,
                        skillAfter: null,
                        passiveAfter: null,
                    },
                },
            },
        })
        const taken = result.plans.nezekan.plannedPath.filter(
            (key) => layouts.nezekan.nodeStats[key] === "attack",
        ).length

        expect(taken).toBe(attackTotal)
    })

    // A minimum met by a node a route only passed through used to be lost
    // when a later search found a cheaper route without it.
    it("keeps a minimum met by a node it only passed through", async () => {
        const cleric = await loadClassPreset("cleric")
        const result = await optimize({
            classPreset: cleric,
            priorities: {
                c: 1,
                b: 1,
                er: 2,
                da: 2,
                rr: 3,
                hl: 3,
                cot: 4,
                dm: 4,
                lor: 4,
                jt: 5,
                d: 5,
                lss: 99,
                pelg: 1,
                phe: 2,
                peg: 2,
                prb: 3,
                pwb: 4,
                piv: 4,
                psw: 5,
                ppoc: 97,
                phb: 98,
                pelb: 99,
            },
            minimums: {
                c: 4,
                b: 4,
                er: 4,
                da: 4,
                rr: 4,
                hl: 4,
                cot: 2,
                dm: 2,
                lor: 4,
                jt: 2,
                d: 2,
                pelg: 4,
                phe: 2,
                peg: 2,
                prb: 2,
                pwb: 2,
                piv: 2,
            },
            maximums: { hl: 4, cot: 2, dm: 2, lor: 4, jt: 4, d: 2, lss: 0 },
            stallMs: 100_000,
        })
        let taken = 0

        for (const board of MAIN_BOARD_IDS) {
            const route = new Set(result.plans[board].plannedPath)

            for (const [key, id] of Object.entries(
                cleric.assignments[board] ?? {},
            )) {
                if (id === "dm" && route.has(key)) {
                    taken += 1
                }
            }
        }

        expect(taken).toBe(2)
        expect(
            result.shortfalls.map((shortfall) => shortfall.abilityId),
        ).not.toContain("dm")
    })

    // A later rank used to reroute a board off Crit nodes the route only
    // passed through, so Survival Willpower (rank 5) took Crit's points.
    it("keeps a maxed stat's nodes from abilities ranked after it", async () => {
        const { cleric, result } = await optimizeMaxedCrit(366)

        for (const board of MAIN_BOARD_IDS) {
            const assignments = cleric.assignments[board] ?? {}

            for (const key of result.plans[board].targetCells) {
                expect(assignments[key], `${board} ${key}`).not.toBe("psw")
            }
        }
    })

    // Refining used to take a route 1 point cheaper that left out two Crit
    // and Attack nodes, and the point it saved couldn't buy them back.
    it("never refines away a maxed stat's nodes", async () => {
        const quick = await optimizeMaxedCrit(416)
        const refined = await optimizeMaxedCrit(416, 100_000)

        expect(maxedCritNodes(refined.result.plans)).toBeGreaterThanOrEqual(
            maxedCritNodes(quick.result.plans),
        )
    })

    // Lower ranks and later searches spend the points left, so a minimum
    // lost along the way can't be put back.
    it.each(CLASS_IDS)(
        "meets every default minimum for %s with points to spare",
        async (classId) => {
            const classPreset = await loadClassPreset(classId)
            const priorities = defaultAbilityPriorities(classPreset)
            const result = await optimize({
                classPreset: classPreset,
                priorities: priorities,
                minimums: resolveAbilityMinimums(classPreset, priorities, {}),
                points: 300,
                stallMs: 100_000,
            })

            expect(result.shortfalls).toEqual([])
        },
    )
})
