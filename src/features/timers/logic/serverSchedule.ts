// EU server time follows Central European time (CET/CEST), so schedules
// kept in server time move in UTC when the clocks change.
const SERVER_TIME_ZONE = "Europe/Berlin"
const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

// A timer that starts at the same server times on the given days, e.g. Mon,
// Thu and Sat at 21:30. `openFor` is how long it lasts after it starts.
export type ServerSchedule = {
    // Minutes after midnight in server time, earliest first.
    times: readonly number[]
    // 0 is Sunday. Every day when missing.
    days?: readonly number[]
    openFor: number
}

// Every `hours` through the day from `fromHour`, e.g. 01:00, 04:00 … 22:00.
export const everyHours = (hours: number, fromHour: number) => {
    const times: number[] = []

    for (let hour = fromHour; hour < 24; hour += hours) {
        times.push(hour * 60)
    }

    return times
}

const partsFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: SERVER_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
})

const getPart = (
    parts: Intl.DateTimeFormatPart[],
    type: Intl.DateTimeFormatPartTypes,
) => {
    return Number(parts.find((part) => part.type === type)?.value)
}

// What the server clock reads at `time`, written as if it were UTC.
const toServerClock = (time: number) => {
    const parts = partsFormat.formatToParts(time)

    return Date.UTC(
        getPart(parts, "year"),
        getPart(parts, "month") - 1,
        getPart(parts, "day"),
        getPart(parts, "hour"),
        getPart(parts, "minute"),
        getPart(parts, "second"),
    )
}

// How far the server clock is ahead of UTC at `time`.
const getServerOffset = (time: number) => {
    return toServerClock(time) - Math.floor(time / 1000) * 1000
}

// When the server clock reads `clock` (a wall time written as UTC). The
// second pass picks up a clock change between the guess and the answer.
const fromServerClock = (clock: number) => {
    const guess = clock - getServerOffset(clock)

    return clock - getServerOffset(guess)
}

// The latest start at or before `now` (null if not since yesterday, server
// time) and the first one after it.
export const getServerStarts = (schedule: ServerSchedule, now: number) => {
    const today = Math.floor(toServerClock(now) / DAY) * DAY
    let last: number | null = null

    // A week and a day covers every weekly schedule.
    for (let day = today - DAY; day <= today + 8 * DAY; day += DAY) {
        const weekday = new Date(day).getUTCDay()

        if (schedule.days && !schedule.days.includes(weekday)) {
            continue
        }

        for (const minutes of schedule.times) {
            const start = fromServerClock(day + minutes * MINUTE)

            if (start > now) {
                return { last: last, next: start }
            }

            last = start
        }
    }

    throw new Error("A server schedule needs at least one start a week.")
}
