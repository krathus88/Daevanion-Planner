import type { ClassPreset } from "@config/classPresets"
import { getStart, keyOf } from "@planner/config/boardConfig"
import { BOARD_IDS, type BoardId } from "@config/boards"
import { layouts, POINTS_PER_NODE_TYPE } from "@planner/config/layouts"
import type {
    AbilityMaximums,
    AbilityMinimums,
    AbilityPriorities,
    MinimumShortfall,
    PriorityPlans,
} from "@planner/storage/abilityPriorities"
import {
    FOCUS_TIERS,
    routeStatScore,
    statWeights,
    STAT_TIERS,
    type FocusTier,
} from "@planner/config/stats"
import {
    DEFAULT_SPECIAL_PRIORITY,
    type SpecialPriorities,
} from "@planner/storage/specialPriorities"
import {
    SAME_RANK_ORDERS,
    type RankGroup,
    type RankOrder,
} from "@planner/storage/rankOrder"
import type { StatSettings } from "@planner/storage/statPriorities"
import { findPlannerPath } from "./plannerLogic"
import { findStatSteps, type StatStep } from "./statFocus"

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
    layout: BoardId
    key: string
    priority: number
    // Place within its rank, from the same-rank order setting.
    orderLevel: number
    cost: number
    abilityId?: string
    isSpecial?: boolean
    // Stat node added with leftover points; not shown as a required target.
    isStat?: boolean
}

// Stat focus: a tier's stat nodes, taken before `waiting`, the abilities
// ranked after it.
type StatBlock = {
    tier: FocusTier
    waiting: PriorityTarget[]
}

// Targets of one rank and same-rank order level, in sort order; none wins
// over another just for coming first.
type RankStep = { targets: PriorityTarget[] } | { block: StatBlock }

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
    specialPriorities: SpecialPriorities,
    rankOrder: RankOrder,
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
            {
                ability: ability,
                defaultPriority: ability.priority ?? index + 2,
            },
        ]),
    )
    const priorityOf = (abilityId: string) => {
        return (
            priorities[abilityId] ??
            abilitiesById.get(abilityId)?.defaultPriority ??
            Number.MAX_SAFE_INTEGER
        )
    }

    const orderLevelOf = (group: RankGroup) => {
        return SAME_RANK_ORDERS.indexOf(rankOrder[group])
    }

    for (const layoutName of Object.keys(layouts) as BoardId[]) {
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
                const key = keyOf({ row: row, column: column })
                if (appearance.type === "special") {
                    const bonus = layout.specialNodeBonuses[key]
                    targets.push({
                        layout: layoutName,
                        key: key,
                        priority: bonus
                            ? specialPriorities[bonus]
                            : DEFAULT_SPECIAL_PRIORITY,
                        orderLevel: orderLevelOf("special"),
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
                    key: key,
                    priority: priorityOf(abilityId),
                    orderLevel: orderLevelOf(appearance.type),
                    cost: POINTS_PER_NODE_TYPE[appearance.type],
                    abilityId: abilityId,
                })
            }
        }
    }

    targets.sort(
        (left, right) =>
            left.priority - right.priority ||
            left.orderLevel - right.orderLevel ||
            left.cost - right.cost ||
            left.layout.localeCompare(right.layout) ||
            left.key.localeCompare(right.key, undefined, { numeric: true }),
    )

    // Stat focus puts each tier's stat nodes just before the first passive
    // ranked after the tier's passive rank, or the first skill ranked after
    // its skill rank, whichever comes first. Abilities of a type with no
    // rank set keep their place in rank order.
    const focus = statSettings.focus
    const waitsBehind = (target: PriorityTarget, tier: FocusTier) => {
        if (target.abilityId === undefined) {
            return false
        }

        const type = abilitiesById.get(target.abilityId)?.ability.type
        const afterRank =
            type === "passive"
                ? focus.tiers[tier].passiveAfter
                : focus.tiers[tier].skillAfter

        return afterRank !== null && target.priority > afterRank
    }
    const blockIndexes = new Map<FocusTier, number>()
    if (focus.enabled) {
        for (const tier of FOCUS_TIERS) {
            const settings = focus.tiers[tier]
            if (
                settings.passiveAfter === null &&
                settings.skillAfter === null
            ) {
                continue
            }

            const index = targets.findIndex((target) =>
                waitsBehind(target, tier),
            )
            blockIndexes.set(tier, index < 0 ? targets.length : index)
        }
    }
    const rankSteps: RankStep[] = []
    for (let index = 0; index <= targets.length; index += 1) {
        for (const tier of FOCUS_TIERS) {
            if (blockIndexes.get(tier) === index) {
                rankSteps.push({
                    block: {
                        tier: tier,
                        waiting: targets
                            .slice(index)
                            .filter((target) => target.abilityId),
                    },
                })
            }
        }
        if (index < targets.length) {
            const target = targets[index]
            const last = rankSteps.at(-1)
            if (
                last &&
                "targets" in last &&
                last.targets[0].priority === target.priority &&
                last.targets[0].orderLevel === target.orderLevel
            ) {
                last.targets.push(target)
            } else {
                rankSteps.push({ targets: [target] })
            }
        }
    }

    const emptyPlan = () => {
        return {
            targetCells: [] as string[],
            plannedPath: [] as string[],
            plannedCost: 0,
        }
    }
    const plans = {
        nezekan: emptyPlan(),
        zikel: emptyPlan(),
        vaizel: emptyPlan(),
        triniel: emptyPlan(),
    } satisfies PriorityPlans
    let totalCost = 0
    // Stats only break ties: equal total cost -> higher total stat score.
    const weightsByBoard = Object.fromEntries(
        (Object.keys(layouts) as BoardId[]).map((layoutName) => [
            layoutName,
            statWeights(layouts[layoutName].nodeStats, statSettings.tiers),
        ]),
    ) as Record<BoardId, Map<string, number>>
    const scores: Record<BoardId, number> = {
        nezekan: 0,
        zikel: 0,
        vaizel: 0,
        triniel: 0,
    }
    let totalScore = 0
    const statTargetKeys: Record<BoardId, Set<string>> = {
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
            timeBudgetMs: timeBudgetMs,
            pointsUsed: totalCost,
        })
    }

    const searchRoute = (
        layoutName: BoardId,
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
            target: target,
            nextTotal: nextTotal,
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
    const isBetter = (candidate: Candidate, best: Candidate | null) => {
        return (
            best === null ||
            candidate.nextTotal < best.nextTotal ||
            (candidate.nextTotal === best.nextTotal &&
                candidate.nextScore > best.nextScore)
        )
    }

    // Fewer points spent reaching the node, leaving out its own cost, so
    // skills, passives and special nodes compete fairly; at equal path
    // cost, better stats.
    const isBetterPath = (candidate: Candidate, best: Candidate | null) => {
        if (best === null) {
            return true
        }

        const pathCost = candidate.nextTotal - candidate.target.cost
        const bestPathCost = best.nextTotal - best.target.cost

        return (
            pathCost < bestPathCost ||
            (pathCost === bestPathCost && candidate.nextScore > best.nextScore)
        )
    }

    // A node counts as an upgrade once any route passes through it.
    const isOnRoute = (target: PriorityTarget) => {
        return plans[target.layout].plannedPath.includes(target.key)
    }
    const upgradesFor = (abilityId: string) => {
        return targets.filter(
            (target) => target.abilityId === abilityId && isOnRoute(target),
        ).length
    }
    // Max only stops the optimizer from choosing more of an ability's nodes;
    // a cheaper route may still pass through extra ones.
    const isAtMaximum = (abilityId: string | undefined) => {
        return (
            abilityId !== undefined &&
            maximums[abilityId] !== undefined &&
            upgradesFor(abilityId) >= maximums[abilityId]
        )
    }

    const minimumAbilities = classPreset.abilities
        .filter((ability) => (minimums[ability.id] ?? 0) > 0)
        .sort((left, right) => priorityOf(left.id) - priorityOf(right.id))

    const specialTargets = targets.filter((target) => target.isSpecial)

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

    const tierAt = (layoutName: BoardId, key: string) => {
        const stat = layouts[layoutName].nodeStats[key]

        return stat ? statSettings.tiers[stat] : undefined
    }
    const tierNodesOnRoutes = (tier: FocusTier) => {
        let count = 0
        for (const layoutName of BOARD_IDS) {
            for (const key of plans[layoutName].plannedPath) {
                if (tierAt(layoutName, key) === tier) {
                    count += 1
                }
            }
        }

        return count
    }

    // Makes stat nodes targets, so later routes for lower-ranked abilities
    // can't trade them away. They still aren't shown as required targets.
    const pinStatNodes = (layoutName: BoardId, keys: string[]) => {
        const plan = plans[layoutName]
        const added = keys.filter((key) => !plan.targetCells.includes(key))
        plans[layoutName] = {
            ...plan,
            targetCells: [...plan.targetCells, ...added],
        }
        for (const key of added) {
            statTargetKeys[layoutName].add(key)
        }
    }

    // Adds a stat step's nodes to its board and pins its wanted stat nodes.
    const commitStatStep = (
        layoutName: BoardId,
        step: StatStep,
        isFree: (key: string) => boolean,
    ) => {
        const plan = plans[layoutName]
        const plannedPath = [...plan.plannedPath, ...step.connector]
        const statScore = routeStatScore(
            plannedPath,
            weightsByBoard[layoutName],
        )
        plans[layoutName] = {
            ...plan,
            plannedPath: plannedPath,
            plannedCost: plan.plannedCost + step.cost,
        }
        totalCost += step.cost
        totalScore += statScore - scores[layoutName]
        scores[layoutName] = statScore
        pinStatNodes(layoutName, step.connector.filter(isFree))
    }

    // Stat focus: takes the tier's stat nodes, least detour first, until its
    // cap or the shared budget runs out. Among equal detours, nodes closer
    // to an ability still waiting win, so the branch is more likely to
    // become part of that ability's route later.
    const fillStatBlock = (block: StatBlock) => {
        const tierRank = STAT_TIERS.indexOf(block.tier)
        const cap = focus.tiers[block.tier].cap ?? Number.POSITIVE_INFINITY
        const stepsByBoard = new Map<BoardId, StatStep[]>()
        let taken = tierNodesOnRoutes(block.tier)

        // The tier's own stat nodes and better ones aren't a detour.
        const isFreeOn = (layoutName: BoardId) => {
            return (key: string) => {
                const tier = tierAt(layoutName, key)
                return (
                    tier !== undefined &&
                    tier !== "ignore" &&
                    STAT_TIERS.indexOf(tier) <= tierRank
                )
            }
        }

        // Keep the wanted stat nodes routes already pass through.
        for (const layoutName of BOARD_IDS) {
            pinStatNodes(
                layoutName,
                plans[layoutName].plannedPath.filter(isFreeOn(layoutName)),
            )
        }

        const stepsFor = (layoutName: BoardId) => {
            const cached = stepsByBoard.get(layoutName)
            if (cached) {
                return cached
            }

            const layout = layouts[layoutName]
            const route = new Set([
                keyOf(getStart(layout)),
                ...plans[layoutName].plannedPath,
            ])
            const wanted = new Set(
                Object.keys(layout.nodeStats).filter(
                    (key) =>
                        tierAt(layoutName, key) === block.tier &&
                        !route.has(key),
                ),
            )
            const waiting = block.waiting
                .filter(
                    (target) =>
                        target.layout === layoutName &&
                        !route.has(target.key) &&
                        !isAtMaximum(target.abilityId),
                )
                .map((target) => target.key)
            const steps = findStatSteps({
                layout: layout,
                route: route,
                wanted: wanted,
                waiting: waiting,
                maxDetour: focus.detour,
                isFree: isFreeOn(layoutName),
            })
            stepsByBoard.set(layoutName, steps)

            return steps
        }

        const countTier = (layoutName: BoardId, step: StatStep) => {
            return step.connector.filter(
                (key) => tierAt(layoutName, key) === block.tier,
            ).length
        }

        const isBetterStep = (step: StatStep, best: StatStep | null) => {
            return (
                best === null ||
                step.detour < best.detour ||
                (step.detour === best.detour &&
                    (step.toWaiting < best.toWaiting ||
                        (step.toWaiting === best.toWaiting &&
                            step.cost < best.cost)))
            )
        }

        while (taken < cap && totalCost < pointBudget) {
            let best: { layoutName: BoardId; step: StatStep } | null = null
            for (const layoutName of BOARD_IDS) {
                // Sorted best first, so the first one that fits is the
                // board's best.
                const step = stepsFor(layoutName).find(
                    (candidate) =>
                        totalCost + candidate.cost <= pointBudget &&
                        taken + countTier(layoutName, candidate) <= cap,
                )
                if (step && isBetterStep(step, best?.step ?? null)) {
                    best = { layoutName: layoutName, step: step }
                }
            }
            if (!best) {
                return
            }

            taken += countTier(best.layoutName, best.step)
            commitStatStep(
                best.layoutName,
                best.step,
                isFreeOn(best.layoutName),
            )
            stepsByBoard.delete(best.layoutName)
            reportProgress()
        }
    }

    const fillByRank = async (stepMs: number, until: number) => {
        for (const step of rankSteps) {
            if (performance.now() >= until) {
                return
            }
            if ("block" in step) {
                fillStatBlock(step.block)
                continue
            }

            // Equal ranks: each step takes the target with the cheapest path.
            // One that doesn't fit now won't fit later in this pass.
            let remaining = step.targets
            while (performance.now() < until) {
                remaining = remaining.filter(
                    (target) =>
                        !plans[target.layout].targetCells.includes(
                            target.key,
                        ) && !isAtMaximum(target.abilityId),
                )
                let best: Candidate | null = null
                const unfit = new Set<PriorityTarget>()
                for (const target of remaining) {
                    const candidate = await tryAddTarget(target, stepMs)
                    if (!candidate) {
                        unfit.add(target)
                    } else if (isBetterPath(candidate, best)) {
                        best = candidate
                    }
                }
                if (!best) {
                    break
                }
                commit(best)
                remaining = remaining.filter((target) => !unfit.has(target))
            }
        }
    }

    // "Spend leftover points": add stat nodes, best weight first, while the
    // shared budget allows. Existing targets stay, so nothing major is lost.
    const statCandidates = (Object.keys(layouts) as BoardId[])
        .flatMap((layoutName) =>
            [...weightsByBoard[layoutName].entries()].map(([key, weight]) => ({
                target: {
                    layout: layoutName,
                    key: key,
                    priority: Number.MAX_SAFE_INTEGER,
                    orderLevel: 0,
                    cost: POINTS_PER_NODE_TYPE.basic,
                    isStat: true,
                } satisfies PriorityTarget,
                weight: weight,
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
        const boards = (Object.keys(plans) as BoardId[]).filter(
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
    // Picking the cheapest of equal ranks each step tries every remaining one.
    const rankCalls = rankSteps.reduce(
        (calls, step) =>
            "targets" in step
                ? calls + (step.targets.length * (step.targets.length + 1)) / 2
                : calls,
        0,
    )
    const greedyStepMs = Math.min(
        MAX_STEP_MS,
        Math.max(
            MIN_STEP_MS,
            (timeBudgetMs * GREEDY_SHARE) /
                Math.max(1, minimumCalls + rankCalls),
        ),
    )

    reportProgress(true)
    // The first pass always completes so every run returns a full plan.
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
                      required: required,
                      achieved: achieved,
                  },
              ]
            : []
    })

    // Stat nodes from leftover points stay on the route but aren't shown as
    // required targets.
    for (const layoutName of Object.keys(plans) as BoardId[]) {
        plans[layoutName].targetCells = plans[layoutName].targetCells.filter(
            (key) => !statTargetKeys[layoutName].has(key),
        )
    }

    return {
        plans: plans,
        shortfalls: shortfalls,
        specialNodes: {
            taken: specialTargets.filter(isOnRoute).length,
            total: specialTargets.length,
        },
    }
}
