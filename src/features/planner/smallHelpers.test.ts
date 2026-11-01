// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ScreenshotResult } from "@planner/hooks/useGameScreenshots"
import { formatSearchTime } from "./config/searchTime"
import { groupResults } from "./game-check/screenshotResults"
import {
    readPrioritiesOpen,
    writePrioritiesOpen,
} from "./storage/prioritiesOpen"

afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
})

describe("formatSearchTime", () => {
    it.each([
        [45, "45s"],
        [59.9, "59s"],
        [60, "1m"],
        [125, "2m 5s"],
        [600, "10m"],
    ])("formats %d seconds", (seconds, text) => {
        expect(formatSearchTime(seconds)).toBe(text)
    })
})

describe("prioritiesOpen", () => {
    it("starts closed and remembers per scope", () => {
        expect(readPrioritiesOpen("board")).toBe(false)

        writePrioritiesOpen("board", true)

        expect(readPrioritiesOpen("board")).toBe(true)
        expect(readPrioritiesOpen("all")).toBe(false)
    })

    it("starts closed when storage is blocked", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked")
        })

        expect(readPrioritiesOpen("board")).toBe(false)
    })

    it("doesn't throw when it can't save", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("blocked")
        })

        expect(() => {
            writePrioritiesOpen("board", true)
        }).not.toThrow()
    })
})

describe("groupResults", () => {
    const result = (fileName: string, boardId: string | null) => {
        return {
            fileName: fileName,
            boardId: boardId,
        } as unknown as ScreenshotResult
    }

    it("lists boards once, in order, and files with no board", () => {
        expect(
            groupResults([
                result("a.png", "zikel"),
                result("b.png", null),
                result("c.png", "nezekan"),
                result("d.png", "zikel"),
            ]),
        ).toEqual({
            boardIds: ["zikel", "nezekan"],
            skippedFiles: ["b.png"],
        })
    })

    it("handles nothing", () => {
        expect(groupResults([])).toEqual({ boardIds: [], skippedFiles: [] })
    })
})
