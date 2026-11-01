import { describe, expect, it } from "vitest"
import { makeLayout } from "@test/boardFixture"
import { findStatSteps, growWithFocus } from "./statFocus"

//   S # #
//   # . #
//   # # #
const ring = makeLayout(["S##", "#.#", "###"])

const steps = (overrides: Partial<Parameters<typeof findStatSteps>[0]>) => {
    return findStatSteps({
        layout: ring,
        route: new Set(["0,0"]),
        wanted: new Set(),
        waiting: [],
        maxDetour: 0,
        isFree: () => {
            return false
        },
        ...overrides,
    })
}

describe("findStatSteps", () => {
    it("charges no detour for free nodes", () => {
        const [step] = steps({
            wanted: new Set(["0,2"]),
            isFree: () => {
                return true
            },
        })

        expect(step).toMatchObject({ key: "0,2", cost: 2, detour: 0 })
        expect(step.connector.sort()).toEqual(["0,1", "0,2"])
    })

    it("counts non-free nodes as detour, up to the limit", () => {
        const wanted = new Set(["0,2"])

        expect(steps({ wanted: wanted, maxDetour: 1 })).toEqual([])
        expect(steps({ wanted: wanted, maxDetour: 2 })[0]).toMatchObject({
            cost: 2,
            detour: 2,
        })
    })

    it("avoids a detour when a free way round exists", () => {
        const free = new Set(["1,0", "2,0", "2,1", "2,2", "1,2", "0,2"])
        const [step] = steps({
            wanted: new Set(["0,2"]),
            maxDetour: 5,
            isFree: (key) => {
                return free.has(key)
            },
        })

        expect(step.detour).toBe(0)
        expect(step.cost).toBe(6)
    })

    it("sorts by detour, then closeness to a waiting ability, then cost", () => {
        const result = steps({
            wanted: new Set(["0,1", "1,0"]),
            waiting: ["2,0"],
            maxDetour: 5,
        })

        expect(result.map((step) => step.key)).toEqual(["1,0", "0,1"])
        expect(result[0].toWaiting).toBe(1)
    })

    it("reads infinity with nothing waiting", () => {
        const [step] = steps({ wanted: new Set(["0,1"]), maxDetour: 1 })

        expect(step.toWaiting).toBe(Number.POSITIVE_INFINITY)
    })

    it("skips nodes on the route or out of reach", () => {
        const layout = makeLayout()

        expect(
            steps({
                layout: layout,
                wanted: new Set(["0,0", "4,0"]),
                maxDetour: 99,
            }),
        ).toEqual([])
    })
})

describe("growWithFocus", () => {
    it("takes each group's wanted nodes within its detour", () => {
        const grown = growWithFocus({
            layout: ring,
            route: new Set(["0,0"]),
            cost: 0,
            budget: 99,
            groups: [
                {
                    wanted: ["0,1", "0,2"],
                    free: ["0,1", "0,2"],
                    waiting: [],
                    detour: 0,
                },
            ],
        })

        expect([...grown.path].sort()).toEqual(["0,0", "0,1", "0,2"])
        expect(grown.cost).toBe(2)
    })

    it("stops at the budget", () => {
        const grown = growWithFocus({
            layout: ring,
            route: new Set(["0,0"]),
            cost: 0,
            budget: 1,
            groups: [
                {
                    wanted: ["0,1", "0,2"],
                    free: ["0,1", "0,2"],
                    waiting: [],
                    detour: 0,
                },
            ],
        })

        expect(grown.cost).toBe(1)
    })

    it("does nothing without groups", () => {
        const grown = growWithFocus({
            layout: ring,
            route: new Set(["0,0"]),
            cost: 0,
            budget: 99,
            groups: [],
        })

        expect(grown.cost).toBe(0)
    })
})
