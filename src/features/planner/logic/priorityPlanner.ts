import type { ClassPreset } from "@config/classPresets"
import type { StatType } from "@config/stats/stats"
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
import { routeStatScore, statWeights } from "@planner/config/stats"
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
import {
    improves,
    isCheaper,
    keepMinimums,
    searchChange,
    swapMinimum,
    upgradesIn,
    type AbilityMinimum,
    type PlanChange,
    type RouteState,
    type SearchRoute,
} from "./minimumRepair"
import { NO_FINDS, type PlanPhase, type SearchFinds } from "./improvementStatus"
import { MAX_SEARCH_MS } from "@planner/config/searchTime"
import { findPlannerPath } from "./plannerLogic"
import { findStatSteps, type StatStep } from "./statFocus"
import { maxedStats, statValues } from "./statOrder"

export type PriorityPlannerLimit = {
    // Each phase ends once this long passes without a better plan.
    stallMs: number
    // Checked between steps: true ends the search with the plan it has.
    shouldStop?: () => boolean
}

export type PriorityPlannerProgress = {
    elapsedMs: number
    // Time since the last better plan, or since the phase began.
    idleMs: number
    stallMs: number
    phase: PlanPhase
    pointsUsed: number
    // Anything committed after the first full plan improves it.
    finds: SearchFinds
}

export type PriorityPlannerResult = {
    plans: PriorityPlans
    shortfalls: MinimumShortfall[]
    specialNodes: { taken: number; total: number }
    finds: SearchFinds
}

type PriorityTarget = {
    layout: MainBoardId
    key: string
    priority: number
    orderLevel: number
    cost: number
    abilityId?: string
    isSpecial?: boolean
}

type StatBlock = {
    stat: StatType
    waiting: PriorityTarget[]
}

// None wins over another just for coming first.
type RankStep = { targets: PriorityTarget[] } | { block: StatBlock }

// The first plan's steps share this much of the stall window.
const GREEDY_SHARE = 0.4
const MIN_STEP_MS = 12
const MAX_STEP_MS = 250
// Refining starts shallow and searches each board longer after every
// round that finds nothing, up to the max.
const FIRST_REFINE_SLICE_MS = 250
const MAX_REFINE_SLICE_MS = 1500
const PROGRESS_INTERVAL_MS = 250

export const optimizePriorityPlans = async (
    classPreset: ClassPreset,
    priorities: AbilityPriorities,
    minimums: AbilityMinimums,
    maximums: AbilityMaximums,
    specialPriorities: SpecialPriorities,
    rankOrder: RankOrder,
    pointBudget: number,
    limit: PriorityPlannerLimit,
    statSettings: StatSettings,
    onProgress: (progress: PriorityPlannerProgress) => void,
    boards: readonly MainBoardId[] = MAIN_BOARD_IDS,
): Promise<PriorityPlannerResult> => {
    const startedAt = performance.now()
    // Set once refining starts: only that phase is capped.
    let capAt = Number.POSITIVE_INFINITY
    const stallMs = limit.stallMs
    let phase: PlanPhase = "build"
    // When the current phase began or last found a better plan.
    let idleSince = startedAt
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
                // Capped at 0 (or skipped): never a target, so nothing waits
                // for it. A route may still pass through.
                if (maximums[abilityId] === 0) {
                    continue
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

    // A maxed stat's nodes all go before the first passive/skill ranked
    // after its ranks, or after every ability. Ties go to the better stat.
    const statMax = statSettings.max
    const waitsBehind = (target: PriorityTarget, stat: StatType) => {
        if (target.abilityId === undefined) {
            return false
        }

        const type = abilitiesById.get(target.abilityId)?.ability.type
        const afterRank =
            type === "passive"
                ? statMax[stat].passiveAfter
                : statMax[stat].skillAfter

        return afterRank !== null && target.priority > afterRank
    }
    const focusStats = maxedStats(statSettings)
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
    const values = statValues(statSettings)
    const weightsByBoard = Object.fromEntries(
        MAIN_BOARD_IDS.map((layoutName) => [
            layoutName,
            statWeights(layouts[layoutName].nodeStats, values),
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

    let finds = NO_FINDS
    const elapsed = () => {
        return performance.now() - startedAt
    }

    const isStopped = () => {
        return limit.shouldStop?.() === true
    }

    // Refining and stats end on a stop or once they go idle too long; the
    // cap only limits refining.
    const isOver = () => {
        const now = performance.now()

        return isStopped() || now - idleSince >= stallMs || now >= capAt
    }

    const never = () => {
        return false
    }

    let lastProgressAt = Number.NEGATIVE_INFINITY
    const reportProgress = (force = false) => {
        const now = performance.now()
        if (!force && now - lastProgressAt < PROGRESS_INTERVAL_MS) {
            return
        }
        lastProgressAt = now
        onProgress({
            elapsedMs: now - startedAt,
            idleMs: Math.max(0, now - idleSince),
            stallMs: stallMs,
            phase: phase,
            pointsUsed: totalCost,
            finds: finds,
        })
    }

    const startPhase = (next: PlanPhase) => {
        phase = next
        idleSince = performance.now()
        capAt =
            next === "refine"
                ? idleSince + MAX_SEARCH_MS
                : Number.POSITIVE_INFINITY
        reportProgress(true)
    }

    // Anything committed once the first plan is built makes it better.
    const noteImprovement = () => {
        if (finds.firstFoundMs === null) {
            return
        }

        idleSince = performance.now()
        finds = {
            ...finds,
            improvements: finds.improvements + 1,
            lastImprovedMs: elapsed(),
        }
        reportProgress(true)
    }

    const searchRoute = (
        layoutName: MainBoardId,
        keys: Set<string>,
        ms: number,
    ) => {
        const layout = layouts[layoutName]
        // Attempts are counted per search; add only the new ones.
        let counted = 0
        return findPlannerPath(
            layout,
            getStart(layout),
            keys,
            { maxMs: ms },
            {
                onBest: () => {},
                onProgress: ({ attempts }) => {
                    finds = {
                        ...finds,
                        optionsChecked:
                            finds.optionsChecked + attempts - counted,
                    }
                    counted = attempts
                    // A refining search can run for over a second; report
                    // during it, not only once it's done.
                    reportProgress()
                },
            },
            weightsByBoard[layoutName],
        )
    }

    const targetsByAbility = new Map<string, PriorityTarget[]>()
    for (const target of targets) {
        if (target.abilityId !== undefined) {
            const abilityTargets = targetsByAbility.get(target.abilityId) ?? []
            abilityTargets.push(target)
            targetsByAbility.set(target.abilityId, abilityTargets)
        }
    }

    const requiredUpgrades = new Map(
        classPreset.abilities.map((ability) => [
            ability.id,
            Math.min(
                minimums[ability.id] ?? 0,
                targetsByAbility.get(ability.id)?.length ?? 0,
            ),
        ]),
    )
    const requiredOf = (abilityId: string) => {
        return requiredUpgrades.get(abilityId) ?? 0
    }

    const minimumAbilities = classPreset.abilities
        .filter((ability) => requiredOf(ability.id) > 0)
        .sort((left, right) => priorityOf(left.id) - priorityOf(right.id))

    const abilityMinimums: AbilityMinimum<MainBoardId>[] = minimumAbilities.map(
        (ability) => ({
            abilityId: ability.id,
            required: requiredOf(ability.id),
            nodes: targetsByAbility.get(ability.id) ?? [],
        }),
    )

    // Nodes pinned to meet a minimum, which a swap may move elsewhere.
    const minimumPins: Record<MainBoardId, Set<string>> = {
        nezekan: new Set(),
        zikel: new Set(),
        vaizel: new Set(),
        triniel: new Set(),
    }

    type Candidate = PlanChange<MainBoardId> & {
        target: PriorityTarget | null
    }

    const routeState = (): RouteState<MainBoardId> => {
        return {
            plans: plans,
            scores: scores,
            totalCost: totalCost,
            totalScore: totalScore,
            pointBudget: pointBudget,
        }
    }

    const searchWith = (ms: number): SearchRoute<MainBoardId> => {
        return async (layoutName, keys) => {
            const result = await searchRoute(layoutName, keys, ms)
            reportProgress()
            if (!result.ok) {
                return null
            }

            return {
                plan: {
                    targetCells: [...keys],
                    plannedPath: [...result.path],
                    plannedCost: result.cost,
                },
                statScore: result.statScore,
            }
        }
    }

    const upgradesFor = (abilityId: string) => {
        return upgradesIn(
            routeState(),
            new Map(),
            targetsByAbility.get(abilityId) ?? [],
        )
    }

    const tryAddTarget = async (
        target: PriorityTarget,
        stepMs: number,
    ): Promise<Candidate | null> => {
        const search = searchWith(stepMs)
        const changes = await searchChange(
            new Map(),
            target.layout,
            new Set([...plans[target.layout].targetCells, target.key]),
            search,
        )
        const kept = changes
            ? await keepMinimums(routeState(), abilityMinimums, changes, search)
            : null

        return kept ? { ...kept, target: target } : null
    }

    const commit = (added: Candidate) => {
        for (const [layoutName, change] of added.changes) {
            plans[layoutName] = change.plan
            scores[layoutName] = change.statScore
        }
        totalCost = added.nextTotal
        totalScore = added.nextScore
        for (const node of added.pinned) {
            minimumPins[node.layout].add(node.key)
        }
        noteImprovement()
    }

    const swapMinimums = async (isDone: () => boolean) => {
        for (const layoutName of boards) {
            for (const key of [...minimumPins[layoutName]]) {
                if (isDone()) {
                    return
                }
                if (!minimumPins[layoutName].has(key)) {
                    continue
                }

                const swapped = await swapMinimum(
                    routeState(),
                    abilityMinimums,
                    { layout: layoutName, key: key },
                    searchWith(MIN_STEP_MS),
                )
                if (swapped) {
                    minimumPins[layoutName].delete(key)
                    commit({ ...swapped, target: null })
                }
            }
        }
    }

    // Excludes the node's own cost so skills, passives and specials compete
    // fairly.
    const isBetterPath = (candidate: Candidate, best: Candidate | null) => {
        if (best === null) {
            return true
        }

        const pathCost = candidate.nextTotal - (candidate.target?.cost ?? 0)
        const bestPathCost = best.nextTotal - (best.target?.cost ?? 0)

        return (
            pathCost < bestPathCost ||
            (pathCost === bestPathCost && candidate.nextScore > best.nextScore)
        )
    }

    const isOnRoute = (target: PriorityTarget) => {
        return plans[target.layout].plannedPath.includes(target.key)
    }

    // Max only limits choices; a cheaper route may still pass extra nodes.
    const isAtMaximum = (abilityId: string | undefined) => {
        return (
            abilityId !== undefined &&
            maximums[abilityId] !== undefined &&
            upgradesFor(abilityId) >= maximums[abilityId]
        )
    }

    const specialTargets = targets.filter((target) => target.isSpecial)

    const fillMinimums = async (stepMs: number, isDone: () => boolean) => {
        for (const ability of minimumAbilities) {
            if (isDone()) {
                return
            }
            const required = requiredOf(ability.id)
            while (upgradesFor(ability.id) < required) {
                let best: Candidate | null = null
                for (const target of targetsByAbility.get(ability.id) ?? []) {
                    if (isOnRoute(target)) {
                        continue
                    }
                    const candidate = await tryAddTarget(target, stepMs)
                    if (candidate && isCheaper(candidate, best)) {
                        best = {
                            ...candidate,
                            pinned: [...candidate.pinned, target],
                        }
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
        noteImprovement()
    }

    // Ties go to nodes near a waiting ability, so its route can reuse the
    // branch.
    const fillStatBlock = (block: StatBlock) => {
        const stepsByBoard = new Map<MainBoardId, StatStep[]>()

        const isFreeOn = (layoutName: MainBoardId) => {
            return (key: string) => {
                const stat = statAt(layoutName, key)
                return stat !== undefined && focusStats.includes(stat)
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

    const fillByRank = async (stepMs: number, isDone: () => boolean) => {
        for (const step of rankSteps) {
            if (isDone()) {
                return
            }
            if ("block" in step) {
                fillStatBlock(step.block)
                continue
            }

            // Something that doesn't fit now won't fit later in this pass.
            let remaining = step.targets
            while (!isDone()) {
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

    // Each board's search fits in what's left before the phase goes idle.
    const refineRoutes = async (sliceMs: number) => {
        const boards = (Object.keys(plans) as MainBoardId[]).filter(
            (layoutName) => plans[layoutName].targetCells.length > 0,
        )
        for (const layoutName of boards) {
            if (isOver()) {
                return
            }
            const remainingMs =
                Math.min(capAt, idleSince + stallMs) - performance.now()
            const changes = await searchChange(
                new Map(),
                layoutName,
                new Set(plans[layoutName].targetCells),
                searchWith(Math.min(sliceMs, remainingMs / boards.length)),
            )
            const refined = changes
                ? await keepMinimums(
                      routeState(),
                      abilityMinimums,
                      changes,
                      searchWith(MIN_STEP_MS),
                  )
                : null
            if (refined && improves(routeState(), refined)) {
                commit({ ...refined, target: null })
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
            (stallMs * GREEDY_SHARE) / Math.max(1, minimumCalls + rankCalls),
        ),
    )
    let refineSliceMs = FIRST_REFINE_SLICE_MS

    // Searches each board longer after a round that found nothing.
    const refineRound = async (round: () => Promise<void>) => {
        const before = finds.improvements
        await round()
        if (finds.improvements === before) {
            refineSliceMs = Math.min(MAX_REFINE_SLICE_MS, refineSliceMs * 2)
        }
    }

    reportProgress(true)

    // The first pass always completes so every run returns a full plan.
    // Swaps go first so minimums don't fight lower ranks for the points
    // they free.
    await fillMinimums(greedyStepMs, never)
    await swapMinimums(isStopped)
    await fillMinimums(greedyStepMs, never)
    await fillByRank(greedyStepMs, never)
    finds = { ...finds, firstFoundMs: elapsed() }
    startPhase("refine")

    while (!isOver()) {
        await refineRound(async () => {
            await refineRoutes(refineSliceMs)
            await swapMinimums(isOver)
            if (isOver()) {
                return
            }
            await fillMinimums(MIN_STEP_MS, isOver)
            await fillByRank(MIN_STEP_MS, isOver)
        })
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
        finds: finds,
    }
}
