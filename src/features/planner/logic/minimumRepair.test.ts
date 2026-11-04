import { describe, expect, it } from "vitest"
import {
    keepMinimums,
    searchChange,
    swapMinimum,
    type AbilityMinimum,
    type RoutePlan,
    type RouteState,
    type SearchRoute,
} from "./minimumRepair"

type Board = "a" | "b"

// Every node costs one point, so a route's cost is its length.
const route = (targetCells: string[], plannedPath: string[]): RoutePlan => {
    return {
        targetCells: targetCells,
        plannedPath: plannedPath,
        plannedCost: plannedPath.length,
    }
}

const makeState = (
    a: RoutePlan,
    b: RoutePlan,
    pointBudget = 100,
): RouteState<Board> => {
    return {
        plans: { a: a, b: b },
        scores: { a: 0, b: 0 },
        totalCost: a.plannedCost + b.plannedCost,
        totalScore: 0,
        pointBudget: pointBudget,
    }
}

// Routes by board and sorted target keys; anything else isn't reachable.
const fakeSearch = (routes: Record<string, string[]>): SearchRoute<Board> => {
    return async (layout, keys) => {
        const path = routes[`${layout}:${[...keys].sort().join(",")}`]

        return path ? { plan: route([...keys], path), statScore: 0 } : null
    }
}

// Ability "s" has one node on each board: a:y and b:z.
const minimumOf = (required: number): AbilityMinimum<Board>[] => {
    return [
        {
            abilityId: "s",
            required: required,
            nodes: [
                { layout: "a", key: "y" },
                { layout: "b", key: "z" },
            ],
        },
    ]
}

describe("keepMinimums", () => {
    it("takes a change that keeps every minimum as it is", async () => {
        const state = makeState(route(["x"], ["x", "y"]), route([], []))
        const search = fakeSearch({ "a:w,x": ["x", "y", "w"] })
        const changes = await searchChange(
            new Map(),
            "a",
            new Set(["x", "w"]),
            search,
        )
        const kept = await keepMinimums(
            state,
            minimumOf(1),
            changes ?? new Map(),
            search,
        )

        expect(kept?.nextTotal).toBe(3)
        expect(kept?.pinned).toEqual([])
    })

    it("keeps a node the new route skipped when that's cheapest", async () => {
        // y was only passed through; the new route to x skips it.
        const state = makeState(route(["x"], ["x", "y"]), route([], []))
        const search = fakeSearch({
            "a:x": ["x"],
            "a:x,y": ["x", "y"],
            "b:z": ["p", "q", "z"],
        })
        const changes = await searchChange(
            new Map(),
            "a",
            new Set(["x"]),
            search,
        )
        const kept = await keepMinimums(
            state,
            minimumOf(1),
            changes ?? new Map(),
            search,
        )

        expect(kept?.nextTotal).toBe(2)
        expect(kept?.pinned).toEqual([{ layout: "a", key: "y" }])
        expect(kept?.changes.get("a")?.plan.plannedPath).toContain("y")
    })

    it("moves a minimum to a cheaper board", async () => {
        // Reaching y on board a takes a long detour; z on board b is next door.
        const state = makeState(
            route(["x"], ["x", "p", "q", "y"]),
            route([], []),
        )
        const search = fakeSearch({
            "a:x": ["x"],
            "a:x,y": ["x", "p", "q", "y"],
            "b:z": ["z"],
        })
        const changes = await searchChange(
            new Map(),
            "a",
            new Set(["x"]),
            search,
        )
        const kept = await keepMinimums(
            state,
            minimumOf(1),
            changes ?? new Map(),
            search,
        )

        expect(kept?.nextTotal).toBe(2)
        expect(kept?.pinned).toEqual([{ layout: "b", key: "z" }])
        expect(kept?.changes.get("a")?.plan.plannedPath).toEqual(["x"])
        expect(kept?.changes.get("b")?.plan.plannedPath).toEqual(["z"])
    })

    it("drops a change when no repair fits the budget", async () => {
        const state = makeState(route(["x"], ["x", "y"]), route([], []), 2)
        const search = fakeSearch({
            "a:w,x": ["x", "w"],
            "a:w,x,y": ["x", "w", "y"],
            "b:z": ["z"],
        })
        const changes = await searchChange(
            new Map(),
            "a",
            new Set(["x", "w"]),
            search,
        )
        const kept = await keepMinimums(
            state,
            minimumOf(1),
            changes ?? new Map(),
            search,
        )

        expect(kept).toBeNull()
    })

    it("doesn't let a minimum already short fall further", async () => {
        // Two are required but only y is on a route: losing y isn't allowed,
        // and nothing forces the second one in.
        const state = makeState(route(["x"], ["x", "y"]), route([], []))
        const search = fakeSearch({
            "a:x": ["x"],
            "a:x,y": ["x", "y"],
            "b:z": ["z"],
        })
        const changes = await searchChange(
            new Map(),
            "a",
            new Set(["x"]),
            search,
        )
        const kept = await keepMinimums(
            state,
            minimumOf(2),
            changes ?? new Map(),
            search,
        )

        expect(kept?.pinned).toHaveLength(1)
        expect(kept?.nextTotal).toBe(2)
    })
})

describe("swapMinimum", () => {
    it("moves a pinned minimum node when that saves points", async () => {
        const state = makeState(
            route(["x", "y"], ["x", "p", "q", "y"]),
            route([], []),
        )
        const search = fakeSearch({ "a:x": ["x"], "b:z": ["z"] })
        const swapped = await swapMinimum(
            state,
            minimumOf(1),
            { layout: "a", key: "y" },
            search,
        )

        expect(swapped?.nextTotal).toBe(2)
        expect(swapped?.pinned).toEqual([{ layout: "b", key: "z" }])
    })

    it("keeps a pinned node when moving it saves nothing", async () => {
        const state = makeState(route(["x", "y"], ["x", "y"]), route([], []))
        const search = fakeSearch({
            "a:x": ["x"],
            "a:x,y": ["x", "y"],
            "b:z": ["z", "p"],
        })
        const swapped = await swapMinimum(
            state,
            minimumOf(1),
            { layout: "a", key: "y" },
            search,
        )

        expect(swapped).toBeNull()
    })

    it("unpins a node another route still passes through", async () => {
        // w's route runs through y anyway, so y needs no pin of its own.
        const state = makeState(
            route(["w", "y"], ["y", "w", "r"]),
            route([], []),
        )
        const search = fakeSearch({ "a:w": ["y", "w"] })
        const swapped = await swapMinimum(
            state,
            minimumOf(1),
            { layout: "a", key: "y" },
            search,
        )

        expect(swapped?.nextTotal).toBe(2)
        expect(swapped?.pinned).toEqual([])
        expect(swapped?.changes.get("a")?.plan.targetCells).toEqual(["w"])
    })

    it("empties a board when its only target is unpinned", async () => {
        const state = makeState(route(["y"], ["p", "y"]), route([], []))
        const search = fakeSearch({ "b:z": ["z"] })
        const swapped = await swapMinimum(
            state,
            minimumOf(1),
            { layout: "a", key: "y" },
            search,
        )

        expect(swapped?.changes.get("a")?.plan).toEqual(route([], []))
        expect(swapped?.pinned).toEqual([{ layout: "b", key: "z" }])
    })
})
