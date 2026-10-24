import type { ClassPreset } from "@config/classPresets"
import { STAT_TYPES, type StatType } from "@config/stats/stats"
import { getStart, keyOf } from "@planner/config/boardConfig"
import { MAIN_BOARD_IDS, type MainBoardId } from "@config/boards"
import { layouts, POINTS_PER_NODE_TYPE } from "@planner/config/layouts"
import type {
    AbilityMaximums,
    AbilityMinimums,
    AbilityPriorities,
    MinimumShortfall,
    PriorityPlans,
} from "@planner/storage/abilityPriorities"
import { routeStatScore, statWeights, STAT_TIERS } from "@planner/config/stats"
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
    layout: MainBoardId
    key: string
    priority: number
    orderLevel: number
    cost: number
    abilityId?: string
    isSpecial?: boolean
    isStat?: boolean
}

type StatBlock = {
    stat: StatType
    waiting: PriorityTarget[]
}

// None wins over another just for coming first.
type RankStep = { targets: PriorityTarget[] } | { block: StatBlock }

const GREEDY_SHARE = 0.4
const MIN_STEP_MS = 12
const MAX_STEP_MS = 250
const MAX_REFINE_SLICE_MS = 1500
const PROGRESS_INTERVAL_MS = 250
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
    boards: readonly MainBoardId[] = MAIN_BOARD_IDS,
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

    for (const layoutName of boards) {
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

    // A stat's nodes go before the first passive/skill ranked after its
    // thresholds. Detour 0 isn't focused; ties go to the better tier.
    const focus = statSettings.focus
    const waitsBehind = (target: PriorityTarget, stat: StatType) => {
        if (target.abilityId === undefined) {
            return false
        }

        const type = abilitiesById.get(target.abilityId)?.ability.type
        const afterRank =
            type === "passive"
                ? focus.stats[stat].passiveAfter
                : focus.stats[stat].skillAfter

        return afterRank !== null && target.priority > afterRank
    }
    const focusStats = !focus.enabled
        ? []
        : STAT_TYPES.filter(
              (stat) =>
                  focus.stats[stat].detour > 0 &&
                  (focus.stats[stat].passiveAfter !== null ||
                      focus.stats[stat].skillAfter !== null),
          ).sort(
              (left, right) =>
                  STAT_TIERS.indexOf(statSettings.tiers[left]) -
                  STAT_TIERS.indexOf(statSettings.tiers[right]),
          )
    const blockIndexes = new Map<StatType, number>()
    for (const stat of focusStats) {
        const index = targets.findIndex((target) => waitsBehind(target, stat))
        blockIndexes.set(stat, index < 0 ? targets.length : index)
    }
    const rankSteps: RankStep[] = []
    for (let index = 0; index <= targets.length; index += 1) {
        for (const stat of focusStats) {
            if (blockIndexes.get(stat) === index) {
                rankSteps.push({
                    block: {
                        stat: stat,
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
    const weightsByBoard = Object.fromEntries(
        MAIN_BOARD_IDS.map((layoutName) => [
            layoutName,
            statWeights(layouts[layoutName].nodeStats, statSettings.tiers),
        ]),
    ) as Record<MainBoardId, Map<string, number>>
    const scores: Record<MainBoardId, number> = {
        nezekan: 0,
        zikel: 0,
        vaizel: 0,
        triniel: 0,
    }
    let totalScore = 0
    const statTargetKeys: Record<MainBoardId, Set<string>> = {
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
        layoutName: MainBoardId,
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
    const isBetter = (candidate: Candidate, best: Candidate | null) => {
        return (
            best === null ||
            candidate.nextTotal < best.nextTotal ||
            (candidate.nextTotal === best.nextTotal &&
                candidate.nextScore > best.nextScore)
        )
    }

    // Excludes the node's own cost so skills, passives and specials compete
    // fairly.
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
    // Max only limits choices; a cheaper route may still pass extra nodes.
    const isAtMaximum = (abilityId: string | undefined) => {
        return (
            abilityId !== undefined &&
            maximums[abilityId] !== undefined &&
            upgradesFor(abilityId) >= maximums[abilityId]
        )
    }

    const requiredUpgrades = new Map(
        classPreset.abilities.map((ability) => [
            ability.id,
            Math.min(
                minimums[ability.id] ?? 0,
                targets.filter((target) => target.abilityId === ability.id)
                    .length,
            ),
        ]),
    )
    const requiredOf = (abilityId: string) => {
        return requiredUpgrades.get(abilityId) ?? 0
    }

    const minimumAbilities = classPreset.abilities
        .filter((ability) => requiredOf(ability.id) > 0)
        .sort((left, right) => priorityOf(left.id) - priorityOf(right.id))

    const specialTargets = targets.filter((target) => target.isSpecial)

    const fillMinimums = async (stepMs: number, until: number) => {
        for (const ability of minimumAbilities) {
            if (performance.now() >= until) {
                return
            }
            const required = requiredOf(ability.id)
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

    const statAt = (layoutName: MainBoardId, key: string) => {
        return layouts[layoutName].nodeStats[key] as StatType | undefined
    }

    // Pinned as targets so lower-ranked routes can't trade them away.
    const pinStatNodes = (layoutName: MainBoardId, keys: string[]) => {
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

    const commitStatStep = (
        layoutName: MainBoardId,
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

    // Ties go to nodes near a waiting ability, so its route can reuse the
    // branch.
    const fillStatBlock = (block: StatBlock) => {
        const stepsByBoard = new Map<MainBoardId, StatStep[]>()

        const isFreeOn = (layoutName: MainBoardId) => {
            return (key: string) => {
                const stat = statAt(layoutName, key)
                return stat !== undefined && focus.stats[stat].detour > 0
            }
        }

        for (const layoutName of boards) {
            pinStatNodes(
                layoutName,
                plans[layoutName].plannedPath.filter(isFreeOn(layoutName)),
            )
        }

        const stepsFor = (layoutName: MainBoardId) => {
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
                        statAt(layoutName, key) === block.stat &&
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
                // The detour counts the stat node's own point.
                maxDetour: focus.stats[block.stat].detour - 1,
                isFree: isFreeOn(layoutName),
            })
            stepsByBoard.set(layoutName, steps)

            return steps
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

        while (totalCost < pointBudget) {
            let best: { layoutName: MainBoardId; step: StatStep } | null = null
            for (const layoutName of boards) {
                const step = stepsFor(layoutName).find(
                    (candidate) => totalCost + candidate.cost <= pointBudget,
                )
                if (step && isBetterStep(step, best?.step ?? null)) {
                    best = { layoutName: layoutName, step: step }
                }
            }
            if (!best) {
                return
            }

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

            // Something that doesn't fit now won't fit later in this pass.
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

    const statCandidates = boards
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

    const refineRoutes = async () => {
        const boards = (Object.keys(plans) as MainBoardId[]).filter(
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
            requiredOf(ability.id) *
                targets.filter((target) => target.abilityId === ability.id)
                    .length,
        0,
    )
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
        const required = requiredOf(ability.id)
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

    for (const layoutName of Object.keys(plans) as MainBoardId[]) {
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
