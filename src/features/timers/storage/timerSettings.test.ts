// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_SERVER_ID } from "@timers/config/servers"
import { DEFAULT_COMING_NEXT_COUNT } from "@timers/logic/comingNext"
import {
    readTimerSettings,
    subscribeToTimerSettings,
    writeTimerSettings,
} from "./timerSettings"

const KEY = "daevanion:timers:v1:settings"

const readStored = (value: unknown) => {
    localStorage.setItem(KEY, JSON.stringify(value))

    return readTimerSettings()
}

afterEach(() => {
    vi.restoreAllMocks()
    // A failed save stays cached under raw null. Reading other text drops it,
    // so it can't leak into the next test.
    localStorage.setItem(KEY, "{}")
    readTimerSettings()
    localStorage.clear()
})

describe("readTimerSettings", () => {
    it("has defaults without a save", () => {
        const settings = readTimerSettings()

        expect(settings.server).toBe(DEFAULT_SERVER_ID)
        expect(settings.comingNextCount).toBe(DEFAULT_COMING_NEXT_COUNT)
        expect(settings.showPinned).toBe(true)
        expect(settings.showShared).toBe(true)
    })

    it("pins at most two per default column", () => {
        for (const column of readTimerSettings().pinned) {
            expect(column.length).toBeLessThanOrEqual(2)
        }
    })

    it("returns the same object until the data changes", () => {
        expect(readTimerSettings()).toBe(readTimerSettings())
    })

    it("falls back to the defaults on unreadable data", () => {
        localStorage.setItem(KEY, "{")

        expect(readTimerSettings().server).toBe(DEFAULT_SERVER_ID)
    })

    it("replaces only the fields that are invalid", () => {
        const settings = readStored({
            showPinned: false,
            server: "nowhere",
            comingNextCount: 99,
        })

        expect(settings.showPinned).toBe(false)
        expect(settings.server).toBe(DEFAULT_SERVER_ID)
        expect(settings.comingNextCount).toBe(DEFAULT_COMING_NEXT_COUNT)
    })

    it.each([
        ["three in a column", [["rift", "shugo", "siege"]]],
        ["an empty column", [[]]],
        ["an unknown timer", [["nope"]]],
        ["a timer twice", [["rift"], ["rift"]]],
        ["no columns", "x"],
    ])("rejects pinned columns with %s", (_name, pinned) => {
        const defaults = readTimerSettings().pinned

        expect(readStored({ pinned: pinned }).pinned).toEqual(defaults)
    })

    it("keeps valid pinned columns", () => {
        expect(readStored({ pinned: [["rift"]] }).pinned).toEqual([["rift"]])
    })

    it("keeps only valid per-timer values", () => {
        const settings = readStored({
            colors: {
                rift: { hue: "red", tone: "soft" },
                shugo: { hue: "neon", tone: "soft" },
                nope: { hue: "red", tone: "soft" },
            },
            soonMinutes: { rift: 5, shugo: -1, siege: 1.5 },
            comingNext: { rift: false, shugo: "x" },
        })

        expect(settings.colors).toEqual({
            rift: { hue: "red", tone: "soft" },
        })
        expect(settings.soonMinutes).toEqual({ rift: 5 })
        expect(settings.comingNext).toEqual({ rift: false })
    })

    it("reads both kinds of boss report", () => {
        const reports = {
            gartua: { spawnAt: 1, reportedAt: 2 },
            "immortal-gartua": { killedAt: 3 },
        }

        expect(readStored({ bossReports: reports }).bossReports).toEqual(
            reports,
        )
    })

    it("reads Gartua's old report field", () => {
        const report = { spawnAt: 1, reportedAt: 2 }

        expect(readStored({ gartua: report }).bossReports).toEqual({
            gartua: report,
        })
    })
})

describe("writeTimerSettings", () => {
    it("round-trips and notifies", () => {
        const listener = vi.fn()
        const unsubscribe = subscribeToTimerSettings(listener)

        writeTimerSettings({ ...readTimerSettings(), showShared: false })
        unsubscribe()

        expect(readTimerSettings().showShared).toBe(false)
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it("keeps a change in memory when an older save exists", () => {
        localStorage.setItem(KEY, "{}")
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full")
        })

        writeTimerSettings({ ...readTimerSettings(), showShared: false })

        expect(readTimerSettings().showShared).toBe(false)
    })
})
