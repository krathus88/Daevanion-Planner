import { ARENA_TASKS } from "@account/game/gameIds"
import type { ArenaModes, ArenaRecord, ArenaSighting } from "@tracker/types"

// The game sends each arena mode's lifetime wins and losses, and this week's
// matches and wins for all modes together. A mode's week is its record now
// minus where it stood when the week began, so each week's start is kept.

// This week's matches and wins, all modes together.
export type ArenaTotals = {
    played: number
    won: number
}

// Whether going from `from` to `to` took exactly the week's matches and
// wins: then nothing was played between the two that the week doesn't count.
const addsUp = (to: ArenaModes, from: ArenaModes, totals: ArenaTotals) => {
    let played = 0
    let won = 0

    for (const mode of new Set([...Object.keys(to), ...Object.keys(from)])) {
        const [wins, losses] = to[mode] ?? [0, 0]
        const [startWins, startLosses] = from[mode] ?? [0, 0]

        if (wins < startWins || losses < startLosses) {
            return false
        }

        played += wins - startWins + losses - startLosses
        won += wins - startWins
    }

    return played === totals.played && won === totals.won
}

// Takes in a new sighting. The week's start is known once a sighting comes
// with no match played this week (it is the start), or when the last one from
// an earlier week adds up to this week's totals (nothing was played between
// it and the reset). Totals are null when they didn't come with it.
export const updateArenaRecord = (
    record: ArenaRecord | undefined,
    seen: ArenaSighting,
    totals: ArenaTotals | null,
): ArenaRecord => {
    const next = findWeekStart(record, seen, totals)

    // Tasks set by hand this week keep their starts.
    return record?.fixed?.period === seen.period
        ? { ...next, fixed: record.fixed }
        : next
}

const findWeekStart = (
    record: ArenaRecord | undefined,
    seen: ArenaSighting,
    totals: ArenaTotals | null,
): ArenaRecord => {
    if (record?.base?.period === seen.period) {
        return { seen: seen, base: record.base }
    }

    if (totals !== null && totals.played === 0) {
        return { seen: seen, base: seen }
    }

    const last = record?.seen

    if (
        totals !== null &&
        last !== undefined &&
        last.period < seen.period &&
        addsUp(seen.modes, last.modes, totals)
    ) {
        return { seen: seen, base: { ...last, period: seen.period } }
    }

    return { seen: seen }
}

// What an arena task counts in a lifetime record: a mode's wins, or its
// matches (wins and losses).
const getLifetime = (modes: ArenaModes, taskId: string) => {
    const source = ARENA_TASKS[taskId]
    const [wins, losses] = modes[source?.mode ?? ""] ?? [0, 0]

    return source?.counts === "won" ? wins : wins + losses
}

// An arena task's count in the record's last week, or null when where it
// stood at the week's start isn't known: from the game's start (every task),
// else from the user setting that task by hand this week.
export const getArenaTaskWeek = (record: ArenaRecord, taskId: string) => {
    const period = record.seen.period
    const start =
        record.base?.period === period
            ? getLifetime(record.base.modes, taskId)
            : record.fixed?.period === period
              ? record.fixed.starts[taskId]
              : undefined

    if (ARENA_TASKS[taskId] === undefined || start === undefined) {
        return null
    }

    return Math.max(0, getLifetime(record.seen.modes, taskId) - start)
}

// Seen this week without knowing where the task stood when the week began:
// the companion missed the reset (or a week), so the task stays manual until
// the user sets or confirms it.
export const isArenaTaskUnknown = (
    record: ArenaRecord | undefined,
    period: number,
    taskId: string,
) => {
    return (
        record !== undefined &&
        record.seen.period === period &&
        getArenaTaskWeek(record, taskId) === null
    )
}

// Whether the game fills an arena task this week (its start is known).
export const isArenaTaskKnown = (
    record: ArenaRecord | undefined,
    period: number,
    taskId: string,
) => {
    return (
        record !== undefined &&
        record.seen.period === period &&
        getArenaTaskWeek(record, taskId) !== null
    )
}

// One task's start this week worked back from the count the user entered or
// confirmed: the last sighting minus it. The game's next records then fill
// that task again; the others stay as they were. A week whose start the game
// knows is left alone.
export const fixArenaTask = (
    record: ArenaRecord,
    taskId: string,
    count: number,
): ArenaRecord => {
    const period = record.seen.period

    if (ARENA_TASKS[taskId] === undefined || record.base?.period === period) {
        return record
    }

    const starts = record.fixed?.period === period ? record.fixed.starts : {}
    const start = Math.max(0, getLifetime(record.seen.modes, taskId) - count)

    return {
        ...record,
        fixed: { period: period, starts: { ...starts, [taskId]: start } },
    }
}
