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

// A mode's matches and wins in the record's last week, or null when that
// week's start isn't known.
export const getArenaWeek = (record: ArenaRecord, mode: string) => {
    if (record.base?.period !== record.seen.period) {
        return null
    }

    const [wins, losses] = record.seen.modes[mode] ?? [0, 0]
    const [startWins, startLosses] = record.base.modes[mode] ?? [0, 0]

    return {
        played: Math.max(0, wins + losses - startWins - startLosses),
        won: Math.max(0, wins - startWins),
    }
}

// Seen this week without knowing where the week began: the companion
// missed the reset (or a week), so the week's arena counts stay manual.
export const isArenaWeekUnknown = (
    record: ArenaRecord | undefined,
    period: number,
) => {
    return (
        record !== undefined &&
        record.seen.period === period &&
        record.base?.period !== period
    )
}

// The week's start worked back from counts the user entered or confirmed
// (mode → this week's matches and wins): the last sighting minus them. The
// game's next records then fill the week again.
export const startFromCounts = (
    record: ArenaRecord,
    counts: Record<string, ArenaTotals>,
): ArenaRecord => {
    const modes: ArenaModes = { ...record.seen.modes }

    for (const [mode, { played, won }] of Object.entries(counts)) {
        const [wins, losses] = modes[mode] ?? [0, 0]

        modes[mode] = [
            Math.max(0, wins - won),
            Math.max(0, losses - Math.max(0, played - won)),
        ]
    }

    return { seen: record.seen, base: { ...record.seen, modes: modes } }
}
