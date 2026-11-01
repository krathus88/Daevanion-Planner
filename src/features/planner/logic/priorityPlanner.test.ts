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
import { loadClassPreset, type ClassPreset } from "@config/classPresets"
import { STAT_TYPES } from "@config/stats/stats"
import { getStart, keyOf } from "@planner/config/boardConfig"
import { layouts } from "@planner/config/layouts"
import { defaultAbilityPriorities } from "@planner/storage/abilityPriorities"
import { DEFAULT_RANK_ORDER } from "@planner/storage/rankOrder"
import { DEFAULT_SPECIAL_PRIORITIES } from "@planner/storage/specialPriorities"
import {
    DEFAULT_STAT_SETTINGS,
    type StatSettings,
} from "@planner/storage/statPriorities"
import { neighborsOf, nodeCost, positionOf } from "./boardLogic"
import { optimizePriorityPlans } from "./priorityPlanner"

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
    timeBudgetMs?: number
    statSettings?: StatSettings
    boards?: readonly MainBoardId[]
    onProgress?: () => void
    classPreset?: ClassPreset
}

const optimize = ({
    points = 225,
    minimums = {},
    maximums = {},
    priorities,
    timeBudgetMs = 1,
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
        timeBudgetMs,
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

    it("spends leftover points on stats when asked", async () => {
        const base = {
            points: 150,
            boards: ["nezekan"] as const,
            timeBudgetMs: 3_000_000,
        }
        const without = await optimize(base)
        const withStats = await optimize({
            ...base,
            statSettings: { ...DEFAULT_STAT_SETTINGS, spendLeftover: true },
        })

        expect(withStats.plans.nezekan.plannedCost).toBeGreaterThan(
            without.plans.nezekan.plannedCost,
        )
        expect(withStats.plans.nezekan.plannedCost).toBeLessThanOrEqual(150)
    })

    it("leaves stat nodes out of the targets", async () => {
        const result = await optimize({
            points: 150,
            boards: ["nezekan"],
            timeBudgetMs: 3_000_000,
            statSettings: { ...DEFAULT_STAT_SETTINGS, spendLeftover: true },
        })

        for (const key of result.plans.nezekan.targetCells) {
            expect(layouts.nezekan.nodeStats[key], key).toBeUndefined()
        }
    })

    it("takes focused stats before lower ranks", async () => {
        const focus: StatSettings = {
            ...DEFAULT_STAT_SETTINGS,
            focus: {
                enabled: true,
                stats: Object.fromEntries(
                    STAT_TYPES.map((stat) => [
                        stat,
                        {
                            passiveAfter: stat === "attack" ? 1 : null,
                            skillAfter: stat === "attack" ? 1 : null,
                            detour: stat === "attack" ? 2 : 0,
                        },
                    ]),
                ) as StatSettings["focus"]["stats"],
            },
        }
        const attackNodes = (path: string[]) => {
            return path.filter(
                (key) => layouts.nezekan.nodeStats[key] === "attack",
            ).length
        }
        const base = { points: 40, boards: ["nezekan"] as const }
        const plain = await optimize(base)
        const focused = await optimize({ ...base, statSettings: focus })

        expect(attackNodes(focused.plans.nezekan.plannedPath)).toBeGreaterThan(
            attackNodes(plain.plans.nezekan.plannedPath),
        )
        expect(focused.plans.nezekan.plannedCost).toBeLessThanOrEqual(40)
    })
})
