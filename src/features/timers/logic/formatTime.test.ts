import { describe, expect, it } from "vitest"
import { formatCountdown, formatDuration } from "./formatTime"

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe("formatCountdown", () => {
    it.each([
        [0, "0m 00s"],
        [5 * SECOND, "0m 05s"],
        [23 * MINUTE + 5 * SECOND, "23m 05s"],
        [HOUR + 12 * MINUTE, "1h 12m"],
        [HOUR + 2 * MINUTE + 59 * SECOND, "1h 02m"],
        [5 * DAY + 17 * HOUR + 30 * MINUTE, "5d 17h"],
    ])("formats %d ms", (ms, text) => {
        expect(formatCountdown(ms)).toBe(text)
    })

    it("stops at zero", () => {
        expect(formatCountdown(-5000)).toBe("0m 00s")
    })
})

describe("formatDuration", () => {
    it.each([
        [30 * MINUTE, "30 m"],
        [HOUR, "1 h"],
        [HOUR + 30 * MINUTE, "1 h 30 m"],
        [0, ""],
    ])("formats %d ms", (ms, text) => {
        expect(formatDuration(ms)).toBe(text)
    })
})
