// Keeps ability minimums met while the priority planner changes routes. A
// minimum is a count across all boards, so it may move between boards.

export type RoutePlan = {
    targetCells: string[]
    plannedPath: string[]
    plannedCost: number
}

type RouteChange = {
    plan: RoutePlan
    statScore: number
}

// A change's new routes, by board; boards it leaves keep their plan.
export type BoardChanges<Board extends string> = Map<Board, RouteChange>

export type BoardNode<Board extends string> = {
    layout: Board
    key: string
}

export type AbilityMinimum<Board extends string> = {
    abilityId: string
    required: number
    nodes: BoardNode<Board>[]
}

export type RouteState<Board extends string> = {
    plans: Record<Board, RoutePlan>
    scores: Record<Board, number>
    totalCost: number
    totalScore: number
    pointBudget: number
}

export type PlanChange<Board extends string> = {
    nextTotal: number
    nextScore: number
    changes: BoardChanges<Board>
    // Nodes pinned to put a minimum back.
    pinned: BoardNode<Board>[]
}

// Null when no route reaches the keys.
export type SearchRoute<Board extends string> = (
    layout: Board,
    keys: Set<string>,
) => Promise<RouteChange | null>

const EMPTY_ROUTE: RouteChange = {
    plan: { targetCells: [], plannedPath: [], plannedCost: 0 },
    statScore: 0,
}

const planIn = <Board extends string>(
    state: RouteState<Board>,
    changes: BoardChanges<Board>,
    layout: Board,
) => {
    return changes.get(layout)?.plan ?? state.plans[layout]
}

// A node counts as an upgrade once any route passes through it.
export const upgradesIn = <Board extends string>(
    state: RouteState<Board>,
    changes: BoardChanges<Board>,
    nodes: BoardNode<Board>[],
) => {
    let count = 0
    for (const node of nodes) {
        if (
            planIn(state, changes, node.layout).plannedPath.includes(node.key)
        ) {
            count += 1
        }
    }

    return count
}

// No change may take an ability below its minimum, or further below it than
// it already is.
const brokenMinimum = <Board extends string>(
    state: RouteState<Board>,
    minimums: AbilityMinimum<Board>[],
    changes: BoardChanges<Board>,
) => {
    return minimums.find((minimum) => {
        const floor = Math.min(
            minimum.required,
            upgradesIn(state, new Map(), minimum.nodes),
        )

        return upgradesIn(state, changes, minimum.nodes) < floor
    })
}

const toPlanChange = <Board extends string>(
    state: RouteState<Board>,
    changes: BoardChanges<Board>,
    pinned: BoardNode<Board>[] = [],
): PlanChange<Board> | null => {
    let nextTotal = state.totalCost
    let nextScore = state.totalScore
    for (const [layout, change] of changes) {
        nextTotal += change.plan.plannedCost - state.plans[layout].plannedCost
        nextScore += change.statScore - state.scores[layout]
    }
    if (nextTotal > state.pointBudget) {
        return null
    }

    return {
        nextTotal: nextTotal,
        nextScore: nextScore,
        changes: changes,
        pinned: pinned,
    }
}

export const isCheaper = <Board extends string>(
    change: PlanChange<Board>,
    best: PlanChange<Board> | null,
) => {
    return (
        best === null ||
        change.nextTotal < best.nextTotal ||
        (change.nextTotal === best.nextTotal &&
            change.nextScore > best.nextScore)
    )
}

export const improves = <Board extends string>(
    state: RouteState<Board>,
    change: PlanChange<Board>,
) => {
    return (
        change.nextTotal < state.totalCost ||
        (change.nextTotal === state.totalCost &&
            change.nextScore > state.totalScore)
    )
}

export const searchChange = async <Board extends string>(
    changes: BoardChanges<Board>,
    layout: Board,
    keys: Set<string>,
    search: SearchRoute<Board>,
) => {
    const route = keys.size === 0 ? EMPTY_ROUTE : await search(layout, keys)

    return route ? new Map(changes).set(layout, route) : null
}

// A new route can skip a node the old one only passed through. When that
// breaks a minimum, the cheapest node of that ability on any board puts it
// back, so a minimum can move to a cheaper board; with none that fits, the
// change is dropped.
export const keepMinimums = async <Board extends string>(
    state: RouteState<Board>,
    minimums: AbilityMinimum<Board>[],
    changes: BoardChanges<Board>,
    search: SearchRoute<Board>,
) => {
    let change = toPlanChange(state, changes)
    let broken = change ? brokenMinimum(state, minimums, changes) : undefined
    while (change && broken) {
        let best: PlanChange<Board> | null = null
        for (const node of broken.nodes) {
            const plan = planIn(state, change.changes, node.layout)
            if (plan.plannedPath.includes(node.key)) {
                continue
            }

            const repaired = await searchChange(
                change.changes,
                node.layout,
                new Set([...plan.targetCells, node.key]),
                search,
            )
            const next = repaired
                ? toPlanChange(state, repaired, [...change.pinned, node])
                : null
            if (next && isCheaper(next, best)) {
                best = next
            }
        }
        change = best
        broken = best ? brokenMinimum(state, minimums, best.changes) : undefined
    }

    return change
}

// Unpins a node picked for a minimum and puts the minimum back wherever it's
// now cheapest. Taken only when it saves points, or keeps the cost and scores
// more.
export const swapMinimum = async <Board extends string>(
    state: RouteState<Board>,
    minimums: AbilityMinimum<Board>[],
    node: BoardNode<Board>,
    search: SearchRoute<Board>,
) => {
    const keys = new Set(state.plans[node.layout].targetCells)
    keys.delete(node.key)
    const changes = await searchChange(new Map(), node.layout, keys, search)
    const swapped = changes
        ? await keepMinimums(state, minimums, changes, search)
        : null

    return swapped && improves(state, swapped) ? swapped : null
}
