const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const pad = (value: number) => {
    return String(value).padStart(2, "0")
}

// "5d 17h", "1h 12m" or "23m 05s": the two largest units left.
export const formatCountdown = (ms: number) => {
    const left = Math.max(0, ms)
    const days = Math.floor(left / DAY)
    const hours = Math.floor((left % DAY) / HOUR)
    const minutes = Math.floor((left % HOUR) / MINUTE)
    const seconds = Math.floor((left % MINUTE) / SECOND)

    if (days > 0) {
        return `${days}d ${hours}h`
    }

    if (hours > 0) {
        return `${hours}h ${pad(minutes)}m`
    }

    return `${minutes}m ${pad(seconds)}s`
}

// A fixed length of time, e.g. "1 h 30 m" or "30 m".
export const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / HOUR)
    const minutes = Math.floor((ms % HOUR) / MINUTE)

    return [hours > 0 && `${hours} h`, minutes > 0 && `${minutes} m`]
        .filter(Boolean)
        .join(" ")
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
})

// The viewer's own time, e.g. "Wed 09:00".
export const formatLocalTime = (time: number) => {
    return timeFormat.format(time)
}
