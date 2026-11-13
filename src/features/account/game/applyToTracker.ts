import { getServer } from "@timers/config/servers"
import { getArenaWeek, updateArenaRecord } from "@tracker/logic/arenaWeeks"
import { getCorridorsUsed } from "@tracker/logic/corridors"
import { getEnergyPeriod } from "@tracker/logic/odyleEnergy"
import { getResetPeriods } from "@tracker/logic/resetPeriods"
import { getTaskOwner } from "@tracker/logic/taskOwners"
import { getTasks, setCubeKeys } from "@tracker/logic/trackerEdits"
import type {
    CorridorRecord,
    TaskCount,
    TaskEntries,
    TrackerCharacter,
    TrackerData,
} from "@tracker/types"
import {
    ARENA_PLAYED,
    ARENA_TASKS,
    ARENA_WON,
    BAG_STORAGE,
    CHARACTER_STORAGE,
    CORRIDOR_TASK,
    CORRIDORS,
    getCorridorTaskId,
    CRAFT_TASKS,
    DUTY_TASK,
    EMERGENCY_SUPPLY,
    ENERGY_COUNTER,
    FACTION_NUMBERS,
    getServerId,
    HIDDEN_CUBE_KEY,
    SUPPLY_TASK,
    TASK_COUNTERS,
} from "./gameIds"
import type { GameSnapshot } from "./gameSnapshot"

// An arena record and the week's totals sent this close together came in one
// load (the companion stamps each section as it arrives).
const ARENA_SAME_LOAD_MS = 60_000

// The tracker's character for a snapshot: same name (any case) on the same
// server. Characters it doesn't have are left for the user to add (the
// Tracker page asks, see getNewGameCharacters).
const findCharacter = (data: TrackerData, snapshot: GameSnapshot) => {
    const server = getServerId(snapshot.character.server)
    const name = snapshot.character.name.toLowerCase()

    return data.characters.find((character) => {
        return (
            character.server === server &&
            character.name.trim().toLowerCase() === name
        )
    })
}

const setOwnerItem = <T>(
    record: Record<string, Record<string, T>>,
    owner: string,
    taskId: string,
    item: T,
) => {
    return { ...record, [owner]: { ...record[owner], [taskId]: item } }
}

const applyCounters = (
    data: TrackerData,
    character: TrackerCharacter,
    snapshot: GameSnapshot,
) => {
    if (snapshot.counters === undefined || snapshot.countersAt === undefined) {
        return data
    }

    const counters = snapshot.counters
    const periods = getResetPeriods(snapshot.countersAt)
    // Counters at 0 are left out of the snapshot.
    const energy = counters[ENERGY_COUNTER] ?? [0, 0]
    const energyLeft: TaskEntries = {
        period: getEnergyPeriod(snapshot.countersAt),
        base: energy[0],
        bonus: energy[1],
    }
    let next: TrackerData = {
        ...data,
        energy: { ...data.energy, [character.id]: energyLeft },
    }

    for (const task of getTasks(data)) {
        const counterId = TASK_COUNTERS[task.id]

        if (counterId === undefined || task.recharge === undefined) {
            continue
        }

        const [base, bonus] = counters[counterId] ?? [0, 0]
        const entries: TaskEntries = {
            period: periods[task.reset],
            base: Math.min(base, task.cap),
            bonus: Math.min(bonus, task.bonusCap ?? 0),
        }

        next = {
            ...next,
            entries: setOwnerItem(
                next.entries,
                getTaskOwner(task, character),
                task.id,
                entries,
            ),
        }
    }

    return next
}

// Weekly crafting limits (Odyle Energy by Substance Morph). A count from an
// earlier week than the tracker's is stale. A server-wide count only grows
// within a week, so a lower one there is another character's older news.
const applyCrafts = (
    data: TrackerData,
    character: TrackerCharacter,
    snapshot: GameSnapshot,
) => {
    if (snapshot.crafts === undefined) {
        return data
    }

    let next = data

    for (const task of getTasks(data)) {
        const source = CRAFT_TASKS[task.id]
        const craft = source && snapshot.crafts[source.recipe]

        if (source === undefined || craft === undefined) {
            continue
        }

        const [server, own, at] = craft
        const owner = getTaskOwner(task, character)
        const before = next.counts[owner]?.[task.id]
        const count: TaskCount = {
            period: getResetPeriods(at)[task.reset],
            count: Math.min(source.limit === "server" ? server : own, task.cap),
        }

        if (
            before !== undefined &&
            (before.period > count.period ||
                (source.limit === "server" &&
                    before.period === count.period &&
                    before.count > count.count))
        ) {
            continue
        }

        next = {
            ...next,
            counts: setOwnerItem(next.counts, owner, task.id, count),
        }
    }

    return next
}

// Hidden Cube keys in the bag and Character Storage.
const applyCubeKeys = (
    data: TrackerData,
    character: TrackerCharacter,
    snapshot: GameSnapshot,
) => {
    if (snapshot.items === undefined) {
        return data
    }

    let count = 0

    for (const storage of [BAG_STORAGE, CHARACTER_STORAGE]) {
        count += snapshot.items[storage]?.[HIDDEN_CUBE_KEY] ?? 0
        count += snapshot.bound?.[storage]?.[HIDDEN_CUBE_KEY] ?? 0
    }

    return setCubeKeys(data, character.id, count)
}

// A delivered Emergency card completes the daily supply request task.
const applySupply = (
    data: TrackerData,
    character: TrackerCharacter,
    snapshot: GameSnapshot,
) => {
    const task = getTasks(data).find((item) => item.id === SUPPLY_TASK)

    if (
        task === undefined ||
        snapshot.supply === undefined ||
        snapshot.supplyAt === undefined
    ) {
        return data
    }

    const at = snapshot.supplyAt
    const emergency = snapshot.supply.find((group) => {
        return (
            group.kind === EMERGENCY_SUPPLY &&
            group.start <= at &&
            at < group.end
        )
    })

    if (emergency === undefined) {
        return data
    }

    const count: TaskCount = {
        period: getResetPeriods(at)[task.reset],
        count: emergency.delivered > 0 ? Math.min(1, task.cap) : 0,
    }

    return {
        ...data,
        counts: setOwnerItem(
            data.counts,
            getTaskOwner(task, character),
            task.id,
            count,
        ),
    }
}

// Duty quests turned in today, from the daily duty board (server-wide). A
// board past its expiry is yesterday's and says nothing about today; a lower
// count in the same day is another character's older news.
const applyDuty = (
    data: TrackerData,
    character: TrackerCharacter,
    snapshot: GameSnapshot,
) => {
    const task = getTasks(data).find((item) => item.id === DUTY_TASK)

    if (
        task === undefined ||
        snapshot.duty === undefined ||
        snapshot.dutyAt === undefined
    ) {
        return data
    }

    const [done, ends] = snapshot.duty
    const at = snapshot.dutyAt

    if (ends <= at) {
        return data
    }

    const owner = getTaskOwner(task, character)
    const before = data.counts[owner]?.[task.id]
    const count: TaskCount = {
        period: getResetPeriods(at)[task.reset],
        count: Math.min(done, task.cap),
    }

    if (
        before !== undefined &&
        (before.period > count.period ||
            (before.period === count.period && before.count > count.count))
    ) {
        return data
    }

    return {
        ...data,
        counts: setOwnerItem(data.counts, owner, task.id, count),
    }
}

// This week's matches and wins from a progress counter: 0 unless it changed
// this week (missing: not lately).
const readWeekly = (snapshot: GameSnapshot, id: string, period: number) => {
    const [count, at] = snapshot.progress?.[id] ?? [0, 0]

    return getResetPeriods(at).weekly === period ? count : 0
}

// Arena tasks from the lifetime record per mode: this week's share is the
// record minus where it stood at the weekly reset (arenaWeeks). The week's
// totals check that start; without one the tasks stay manual this week and
// the card warns.
const applyArena = (
    data: TrackerData,
    character: TrackerCharacter,
    snapshot: GameSnapshot,
) => {
    const at = snapshot.arenaAt
    const before = data.arena[character.id]

    if (
        snapshot.arena === undefined ||
        at === undefined ||
        (before !== undefined && before.seen.at >= at)
    ) {
        return data
    }

    const period = getResetPeriods(at).weekly
    // The totals come in the same load as the record.
    const withTotals =
        snapshot.progressAt !== undefined &&
        Math.abs(snapshot.progressAt - at) < ARENA_SAME_LOAD_MS
    const record = updateArenaRecord(
        before,
        { period: period, at: at, modes: snapshot.arena },
        withTotals
            ? {
                  played: readWeekly(snapshot, ARENA_PLAYED, period),
                  won: readWeekly(snapshot, ARENA_WON, period),
              }
            : null,
    )
    let next: TrackerData = {
        ...data,
        arena: { ...data.arena, [character.id]: record },
    }

    for (const task of getTasks(data)) {
        const source = ARENA_TASKS[task.id]
        const week = source && getArenaWeek(record, source.mode)

        if (!source || !week) {
            continue
        }

        next = {
            ...next,
            counts: setOwnerItem(
                next.counts,
                getTaskOwner(task, character),
                task.id,
                {
                    period: getResetPeriods(at)[task.reset],
                    count: Math.min(week[source.counts], task.cap),
                },
            ),
        }
    }

    return next
}

// Abyss corridors. The corridors a faction holds after a siege are its
// server's (any character there can tell); each character then has one
// entrance per corridor, used on entering (the companion drops it then). The
// task has a 0/1 row per held corridor (getCorridorTaskId), set for every
// character on the server whose entrances were read since the siege.
const applyCorridors = (
    data: TrackerData,
    character: TrackerCharacter,
    snapshot: GameSnapshot,
) => {
    const task = getTasks(data).find((item) => item.id === CORRIDOR_TASK)
    const server = getServer(character.server)
    let holds = data.corridorHolds
    let left = data.corridorsLeft

    if (snapshot.artifacts && snapshot.siegeEnd !== undefined && server) {
        const faction = FACTION_NUMBERS[server.faction]
        const hold: CorridorRecord = {
            period: getResetPeriods(snapshot.siegeEnd).siege,
            at: snapshot.siegeEnd,
            artifacts: CORRIDORS.filter((corridor) => {
                return snapshot.artifacts?.[corridor.artifact] === faction
            }).map((corridor) => corridor.artifact),
        }
        const before = holds[character.server]

        if (before === undefined || before.at <= hold.at) {
            holds = { ...holds, [character.server]: hold }
        }
    }

    if (snapshot.corridorsAt !== undefined) {
        const open = snapshot.corridors ?? []
        const record: CorridorRecord = {
            period: getResetPeriods(snapshot.corridorsAt).siege,
            at: snapshot.corridorsAt,
            artifacts: CORRIDORS.filter((corridor) => {
                return open.includes(corridor.counter)
            }).map((corridor) => corridor.artifact),
        }
        const before = left[character.id]

        if (before === undefined || before.at <= record.at) {
            left = { ...left, [character.id]: record }
        }
    }

    if (holds === data.corridorHolds && left === data.corridorsLeft) {
        return data
    }

    let next: TrackerData = {
        ...data,
        corridorHolds: holds,
        corridorsLeft: left,
    }
    const hold = holds[character.server]

    if (task === undefined || hold === undefined) {
        return next
    }

    for (const other of data.characters) {
        const used = getCorridorsUsed(
            other.server === character.server ? hold : undefined,
            left[other.id],
        )

        // Each held corridor is its own row, done once its entrance is used.
        for (const artifact of used === null ? [] : hold.artifacts) {
            next = {
                ...next,
                counts: setOwnerItem(
                    next.counts,
                    other.id,
                    getCorridorTaskId(artifact),
                    {
                        period: hold.period,
                        count: used?.includes(artifact) ? 1 : 0,
                    },
                ),
            }
        }
    }

    return next
}

// The game's values replace what the tracker had: the game is the real data.
export const applyToTracker = (
    data: TrackerData,
    snapshot: GameSnapshot,
): TrackerData => {
    const character = findCharacter(data, snapshot)

    if (character === undefined) {
        return data
    }

    const withCounters = applyCounters(data, character, snapshot)
    const withKeys = applyCubeKeys(withCounters, character, snapshot)
    const withSupply = applySupply(withKeys, character, snapshot)
    const withDuty = applyDuty(withSupply, character, snapshot)
    const withArena = applyArena(withDuty, character, snapshot)

    const withCrafts = applyCrafts(withArena, character, snapshot)

    return applyCorridors(withCrafts, character, snapshot)
}
