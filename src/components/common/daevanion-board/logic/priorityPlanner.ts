import type { ClassPreset } from "../../../../config/classPresets"
import { getStart } from "../config/boardConfig"
import {
    layouts,
    POINTS_PER_NODE_TYPE,
    type BoardLayoutName,
} from "../config/layouts"
import type {
    AbilityMaximums,
    AbilityMinimums,
    AbilityPriorities,
    MinimumShortfall,
    PriorityPlans,
} from "../storage/abilityPriorities"
import { statWeights } from "../config/stats"
import type { StatSettings } from "../storage/statPriorities"
import { findPlannerPath } from "./plannerLogic"

export type PriorityPlannerProgress = {
    elapsedMs: number
    timeBudgetMs: number
    pointsUsed: number
}

export type PriorityPlannerResult = {
    plans: PriorityPlans
    shortfalls: MinimumShortfall[]
    specialNodes: { taken: number; total: number }
}

type PriorityTarget = {
    layout: BoardLayoutName
    key: string
    priority: number
    cost: number
    abilityId?: string
    isSpecial?: boolean
    // Stat node added with leftover points; not shown as a required target.
    isStat?: boolean
}

// Share of the run spent on the first greedy pass; the rest refines it.
const GREEDY_SHARE = 0.4
const MIN_STEP_MS = 12
const MAX_STEP_MS = 250
const MAX_REFINE_SLICE_MS = 1500
const PROGRESS_INTERVAL_MS = 250
// With "spend leftover points" on, the last part of the run adds stat nodes,
// after everything else has had the full budget.
const STAT_FILL_SHARE = 0.15
const STAT_STEP_MS = 30

export const optimizePriorityPlans = async (
    classPreset: ClassPreset,
    priorities: AbilityPriorities,
    minimums: AbilityMinimums,
    maximums: AbilityMaximums,
    pointBudget: number,
    timeBudgetMs: number,
    statSettings: StatSettings,
    onProgress: (progress: PriorityPlannerProgress) => void,
): Promise<PriorityPlannerResult> => {
    const startedAt = performance.now()
    const deadline = startedAt + timeBudgetMs
    const targets: PriorityTarget[] = []
    const abilitiesById = new Map(
        classPreset.abilities.map((ability, index) => [
            ability.id,
            { ability, defaultPriority: ability.priority ?? index + 2 },
        ]),
    )
    const priorityOf = (abilityId: string) =>
        priorities[abilityId] ??
        abilitiesById.get(abilityId)?.defaultPriority ??
        Number.MAX_SAFE_INTEGER

    for (const layoutName of Object.keys(layouts) as BoardLayoutName[]) {
        const layout = layouts[layoutName]
        const assignments = classPreset.assignments[layoutName] ?? {}
        for (let row = 0; row < layout.grid.length; row += 1) {
            for (
                let column = 0;
                column < layout.grid[row].length;
                column += 1
            ) {
                const kind = layout.grid[row][column]
                if (kind === "." || kind === "S") {
                    continue
                }

                const appearance = layout.specialNodes[kind] ?? layout.mainNode
                const key = `${row},${column}`
                if (appearance.type === "special") {
                    targets.push({
                        layout: layoutName,
                        key,
                        priority: 1,
                        cost: POINTS_PER_NODE_TYPE.special,
                        isSpecial: true,
                    })
                    continue
                }

                if (
                    appearance.type !== "skill" &&
                    appearance.type !== "passive"
                ) {
                    continue
                }

                const abilityId = assignments[key]
                const configuredAbility = abilityId
                    ? abilitiesById.get(abilityId)
                    : undefined
                if (!configuredAbility) {
                    continue
                }
                if (configuredAbility.ability.type !== appearance.type) {
                    throw new Error(
                        `Invalid ${classPreset.name} assignment at ${layoutName} ${key}.`,
                    )
                }

                targets.push({
                    layout: layoutName,
                    key,
                    priority: priorityOf(abilityId),
                    cost: POINTS_PER_NODE_TYPE[appearance.type],
                    abilityId,
                })
            }
        }
    }

    targets.sort(
        (left, right) =>
            left.priority - right.priority ||
            left.cost - right.cost ||
            left.layout.localeCompare(right.layout) ||
            left.key.localeCompare(right.key, undefined, { numeric: true }),
    )

    const emptyPlan = () => ({
        targetCells: [] as string[],
        plannedPath: [] as string[],
        plannedCost: 0,
    })
    const plans = {
        nezekan: emptyPlan(),
        zikel: emptyPlan(),
        vaizel: emptyPlan(),
        triniel: emptyPlan(),
    } satisfies PriorityPlans
    let totalCost = 0
    // Stats only break ties: equal total cost -> higher total stat score.
    const weightsByBoard = Object.fromEntries(
        (Object.keys(layouts) as BoardLayoutName[]).map((layoutName) => [
            layoutName,
            statWeights(layouts[layoutName].nodeStats, statSettings.tiers),
        ]),
    ) as Record<BoardLayoutName, Map<string, number>>
    const scores: Record<BoardLayoutName, number> = {
        nezekan: 0,
        zikel: 0,
        vaizel: 0,
        triniel: 0,
    }
    let totalScore = 0
    const statTargetKeys: Record<BoardLayoutName, Set<string>> = {
        nezekan: new Set(),
        zikel: new Set(),
        vaizel: new Set(),
        triniel: new Set(),
    }

    let lastProgressAt = Number.NEGATIVE_INFINITY
    const reportProgress = (force = false) => {
        const now = performance.now()
        if (!force && now - lastProgressAt < PROGRESS_INTERVAL_MS) {
            return
        }
        lastProgressAt = now
        onProgress({
            elapsedMs: Math.min(timeBudgetMs, now - startedAt),
            timeBudgetMs,
            pointsUsed: totalCost,
        })
    }

    const searchRoute = (
        layoutName: BoardLayoutName,
        keys: Set<string>,
        ms: number,
    ) => {
        const layout = layouts[layoutName]
        return findPlannerPath(
            layout,
            getStart(layout),
            keys,
            ms,
            { onBest: () => {}, onProgress: () => {} },
            weightsByBoard[layoutName],
        )
    }

    // Tries adding one target to its board's plan and returns the result
    // without committing it, or null if no route fits the shared budget.
    const tryAddTarget = async (target: PriorityTarget, stepMs: number) => {
        const currentPlan = plans[target.layout]
        const candidateTargets = new Set([
            ...currentPlan.targetCells,
            target.key,
        ])
        const result = await searchRoute(
            target.layout,
            candidateTargets,
            stepMs,
        )
        reportProgress()
        if (!result.ok) {
            return null
        }

        const nextTotal = totalCost - currentPlan.plannedCost + result.cost
        if (nextTotal > pointBudget) {
            return null
        }

        return {
            target,
            nextTotal,
            nextScore: totalScore - scores[target.layout] + result.statScore,
            statScore: result.statScore,
            plan: {
                targetCells: [...candidateTargets],
                plannedPath: [...result.path],
                plannedCost: result.cost,
            },
        }
    }

    const commit = (
        added: NonNullable<Awaited<ReturnType<typeof tryAddTarget>>>,
    ) => {
        plans[added.target.layout] = added.plan
        totalCost = added.nextTotal
        scores[added.target.layout] = added.statScore
        totalScore = added.nextScore
        if (added.target.isStat) {
            statTargetKeys[added.target.layout].add(added.target.key)
        }
    }

    type Candidate = NonNullable<Awaited<ReturnType<typeof tryAddTarget>>>
    // Fewer total points first; at equal points, better stats.
    const isBetter = (candidate: Candidate, best: Candidate | null) =>
        best === null ||
        candidate.nextTotal < best.nextTotal ||
        (candidate.nextTotal === best.nextTotal &&
            candidate.nextScore > best.nextScore)

    // A node counts as an upgrade once any route passes through it.
    const isOnRoute = (target: PriorityTarget) =>
        plans[target.layout].plannedPath.includes(target.key)
    const upgradesFor = (abilityId: string) =>
        targets.filter(
            (target) => target.abilityId === abilityId && isOnRoute(target),
        ).length
    // Max only stops the optimizer from choosing more of an ability's nodes;
    // a cheaper route may still pass through extra ones.
    const isAtMaximum = (abilityId: string | undefined) =>
        abilityId !== undefined &&
        maximums[abilityId] !== undefined &&
        upgradesFor(abilityId) >= maximums[abilityId]

    const minimumAbilities = classPreset.abilities
        .filter((ability) => (minimums[ability.id] ?? 0) > 0)
        .sort((left, right) => priorityOf(left.id) - priorityOf(right.id))

    const specialTargets = targets.filter((target) => target.isSpecial)

    // Top priority: take every special node on every board before anything
    // else. Each step takes the special node that adds the fewest points.
    const fillSpecials = async (stepMs: number, until: number) => {
        while (performance.now() < until) {
            let best: Candidate | null = null
            for (const target of specialTargets) {
                if (isOnRoute(target)) {
                    continue
                }
                const candidate = await tryAddTarget(target, stepMs)
                if (candidate && isBetter(candidate, best)) {
                    best = candidate
                }
            }
            if (!best) {
                return
            }
            commit(best)
        }
    }

    // Reserve minimum upgrades in rank order. Each step takes the ability's
    // node that adds the fewest points to the shared total.
    const fillMinimums = async (stepMs: number, until: number) => {
        for (const ability of minimumAbilities) {
            if (performance.now() >= until) {
                return
            }
            const required = minimums[ability.id] ?? 0
            while (upgradesFor(ability.id) < required) {
                let best: Candidate | null = null
                for (const target of targets) {
                    if (target.abilityId !== ability.id || isOnRoute(target)) {
                        continue
                    }
                    const candidate = await tryAddTarget(target, stepMs)
                    if (candidate && isBetter(candidate, best)) {
                        best = candidate
                    }
                }
                if (!best) {
                    break
                }
                commit(best)
            }
        }
    }

    const fillByRank = async (stepMs: number, until: number) => {
        for (const target of targets) {
            if (performance.now() >= until) {
                return
            }
            if (
                plans[target.layout].targetCells.includes(target.key) ||
                isAtMaximum(target.abilityId)
            ) {
                continue
            }
            const added = await tryAddTarget(target, stepMs)
            if (added) {
                commit(added)
            }
        }
    }

    // "Spend leftover points": add stat nodes, best weight first, while the
    // shared budget allows. Existing targets stay, so nothing major is lost.
    const statCandidates = (Object.keys(layouts) as BoardLayoutName[])
        .flatMap((layoutName) =>
            [...weightsByBoard[layoutName].entries()].map(([key, weight]) => ({
                target: {
                    layout: layoutName,
                    key,
                    priority: Number.MAX_SAFE_INTEGER,
                    cost: POINTS_PER_NODE_TYPE.basic,
                    isStat: true,
                } satisfies PriorityTarget,
                weight,
            })),
        )
        .sort((left, right) => right.weight - left.weight)
        .map(({ target }) => target)

    const fillStats = async (until: number) => {
        for (const target of statCandidates) {
            if (performance.now() >= until || totalCost >= pointBudget) {
                return
            }
            if (isOnRoute(target)) {
                continue
            }
            const added = await tryAddTarget(target, STAT_STEP_MS)
            if (added) {
                commit(added)
            }
        }
    }

    // Search each board's current targets again for a cheaper route, or an
    // equally cheap one through better stats.
    const refineRoutes = async () => {
        const boards = (Object.keys(plans) as BoardLayoutName[]).filter(
            (layoutName) => plans[layoutName].targetCells.length > 0,
        )
        for (const layoutName of boards) {
            const remainingMs = deadline - performance.now()
            if (remainingMs <= 0) {
                return
            }
            const plan = plans[layoutName]
            const result = await searchRoute(
                layoutName,
                new Set(plan.targetCells),
                Math.min(MAX_REFINE_SLICE_MS, remainingMs / boards.length),
            )
            reportProgress()
            if (
                result.ok &&
                (result.cost < plan.plannedCost ||
                    (result.cost === plan.plannedCost &&
                        result.statScore > scores[layoutName]))
            ) {
                totalCost += result.cost - plan.plannedCost
                totalScore += result.statScore - scores[layoutName]
                scores[layoutName] = result.statScore
                plans[layoutName] = {
                    ...plan,
                    plannedPath: [...result.path],
                    plannedCost: result.cost,
                }
            }
        }
    }

    const minimumCalls = minimumAbilities.reduce(
        (calls, ability) =>
            calls +
            (minimums[ability.id] ?? 0) *
                targets.filter((target) => target.abilityId === ability.id)
                    .length,
        0,
    )
    // Picking the cheapest special each step tries every remaining one.
    const specialCalls =
        (specialTargets.length * (specialTargets.length + 1)) / 2
    const greedyStepMs = Math.min(
        MAX_STEP_MS,
        Math.max(
            MIN_STEP_MS,
            (timeBudgetMs * GREEDY_SHARE) /
                Math.max(1, specialCalls + minimumCalls + targets.length),
        ),
    )

    reportProgress(true)
    // The first pass always completes so every run returns a full plan.
    await fillSpecials(greedyStepMs, Number.POSITIVE_INFINITY)
    await fillMinimums(greedyStepMs, Number.POSITIVE_INFINITY)
    await fillByRank(greedyStepMs, Number.POSITIVE_INFINITY)

    const mainDeadline = statSettings.spendLeftover
        ? startedAt + timeBudgetMs * (1 - STAT_FILL_SHARE)
        : deadline
    while (performance.now() < mainDeadline) {
        await refineRoutes()
        if (performance.now() >= mainDeadline) {
            break
        }
        await fillSpecials(MIN_STEP_MS, mainDeadline)
        await fillMinimums(MIN_STEP_MS, mainDeadline)
        await fillByRank(MIN_STEP_MS, mainDeadline)
    }

    if (statSettings.spendLeftover) {
        await fillStats(deadline)
        while (performance.now() < deadline) {
            await refineRoutes()
            await fillStats(deadline)
        }
    }

    reportProgress(true)

    const shortfalls = minimumAbilities.flatMap((ability) => {
        const required = minimums[ability.id] ?? 0
        const achieved = upgradesFor(ability.id)
        return achieved < required
            ? [
                  {
                      abilityId: ability.id,
                      name: ability.name,
                      required,
                      achieved,
                  },
              ]
            : []
    })

    // Stat nodes from leftover points stay on the route but aren't shown as
    // required targets.
    for (const layoutName of Object.keys(plans) as BoardLayoutName[]) {
        plans[layoutName].targetCells = plans[layoutName].targetCells.filter(
            (key) => !statTargetKeys[layoutName].has(key),
        )
    }

    return {
        plans,
        shortfalls,
        specialNodes: {
            taken: specialTargets.filter(isOnRoute).length,
            total: specialTargets.length,
        },
    }
}
