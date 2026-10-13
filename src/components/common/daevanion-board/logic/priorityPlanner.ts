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
import { findPlannerPath } from "./plannerLogic"

export type PriorityPlannerProgress = {
    elapsedMs: number
    timeBudgetMs: number
    pointsUsed: number
}

export type PriorityPlannerResult = {
    plans: PriorityPlans
    shortfalls: MinimumShortfall[]
}

type PriorityTarget = {
    layout: BoardLayoutName
    key: string
    priority: number
    cost: number
    abilityId?: string
}

// Share of the run spent on the first greedy pass; the rest refines it.
const GREEDY_SHARE = 0.4
const MIN_STEP_MS = 12
const MAX_STEP_MS = 250
const MAX_REFINE_SLICE_MS = 1500
const PROGRESS_INTERVAL_MS = 250

export const optimizePriorityPlans = async (
    classPreset: ClassPreset,
    priorities: AbilityPriorities,
    minimums: AbilityMinimums,
    maximums: AbilityMaximums,
    pointBudget: number,
    timeBudgetMs: number,
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
        return findPlannerPath(layout, getStart(layout), keys, ms, {
            onBest: () => {},
            onProgress: () => {},
        })
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
    }

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

    // Reserve minimum upgrades in rank order. Each step takes the ability's
    // node that adds the fewest points to the shared total.
    const fillMinimums = async (stepMs: number, until: number) => {
        for (const ability of minimumAbilities) {
            if (performance.now() >= until) {
                return
            }
            const required = minimums[ability.id] ?? 0
            while (upgradesFor(ability.id) < required) {
                let best: Awaited<ReturnType<typeof tryAddTarget>> = null
                for (const target of targets) {
                    if (target.abilityId !== ability.id || isOnRoute(target)) {
                        continue
                    }
                    const candidate = await tryAddTarget(target, stepMs)
                    if (
                        candidate &&
                        (best === null || candidate.nextTotal < best.nextTotal)
                    ) {
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

    // Search each board's current targets again for a cheaper route.
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
            if (result.ok && result.cost < plan.plannedCost) {
                totalCost += result.cost - plan.plannedCost
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
    const greedyStepMs = Math.min(
        MAX_STEP_MS,
        Math.max(
            MIN_STEP_MS,
            (timeBudgetMs * GREEDY_SHARE) /
                Math.max(1, minimumCalls + targets.length),
        ),
    )

    reportProgress(true)
    // The first pass always completes so every run returns a full plan.
    await fillMinimums(greedyStepMs, Number.POSITIVE_INFINITY)
    await fillByRank(greedyStepMs, Number.POSITIVE_INFINITY)

    while (performance.now() < deadline) {
        await refineRoutes()
        if (performance.now() >= deadline) {
            break
        }
        await fillMinimums(MIN_STEP_MS, deadline)
        await fillByRank(MIN_STEP_MS, deadline)
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

    return { plans, shortfalls }
}
