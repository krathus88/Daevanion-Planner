import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AuthState } from "@account/auth"
import { useNow } from "./useNow"
import { useTimers } from "./useTimers"
import { useTimerSettings } from "./useTimerSettings"

const mocks = vi.hoisted(() => {
    return {
        auth: { status: "signedOut", error: null } as AuthState,
        shared: {} as Record<string, unknown>,
        write: vi.fn(),
    }
})

vi.mock("@account/hooks/useAuth", () => {
    return {
        useAuth: () => {
            return mocks.auth
        },
    }
})

vi.mock("./useSharedReports", () => {
    return {
        useSharedReports: () => {
            return mocks.shared
        },
    }
})

vi.mock("@timers/shared/sharedReports", () => {
    return {
        getSharedReportKey: (scope: string, bossId: string) => {
            return `${scope}/${bossId}`
        },
        writeSharedReport: mocks.write,
    }
})

const REPORTER: AuthState = {
    status: "signedIn",
    userId: "u",
    name: "n",
    isReporter: true,
}

beforeEach(() => {
    mocks.auth = { status: "signedOut", error: null }
    mocks.shared = {}
    mocks.write.mockReset()
})

describe("useNow", () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it("ticks every second", () => {
        vi.useFakeTimers()
        vi.setSystemTime(10_000)

        const { result, unmount } = renderHook(() => {
            return useNow()
        })
        const first = result.current

        act(() => {
            vi.advanceTimersByTime(1100)
        })

        expect(result.current).toBeGreaterThan(first)

        unmount()
        expect(vi.getTimerCount()).toBe(0)
    })
})

describe("useTimerSettings", () => {
    const setup = () => {
        return renderHook(() => {
            return useTimerSettings()
        }).result
    }

    it("pins and unpins a timer", () => {
        const result = setup()

        act(() => {
            result.current.changePinnedColumns([])
        })
        act(() => {
            result.current.togglePinned("rift")
        })
        expect(result.current.settings.pinned).toEqual([["rift"]])

        act(() => {
            result.current.togglePinned("rift")
        })
        expect(result.current.settings.pinned).toEqual([])
    })

    it("sets and resets a color", () => {
        const result = setup()
        const color = { hue: "red", tone: "soft" } as const

        act(() => {
            result.current.changeTimerColor("rift", color)
        })
        expect(result.current.settings.colors.rift).toEqual(color)

        act(() => {
            result.current.resetTimerColor("rift")
        })
        expect(result.current.settings.colors.rift).toBeUndefined()
    })

    it("sets and clears a boss report", () => {
        const result = setup()

        act(() => {
            result.current.changeBossReport("gartua", { killedAt: 5 })
        })
        expect(result.current.settings.bossReports.gartua).toEqual({
            killedAt: 5,
        })

        act(() => {
            result.current.changeBossReport("gartua", null)
        })
        expect(result.current.settings.bossReports.gartua).toBeUndefined()
    })

    it("saves the simple settings", () => {
        const result = setup()

        act(() => {
            result.current.changeSoonMinutes("rift", 9)
            result.current.changeShowPinned(false)
            result.current.changeComingNext("rift", false)
            result.current.changeShowComingNext(true)
            result.current.changeComingNextCount(2)
            result.current.changeComingNextPosition({
                dock: "header",
                along: 0.5,
            })
            result.current.changeServer("israphel")
            result.current.changeShowShared(false)
        })

        expect(result.current.settings).toMatchObject({
            soonMinutes: { rift: 9 },
            showPinned: false,
            comingNext: { rift: false },
            showComingNext: true,
            comingNextCount: 2,
            comingNextPosition: { dock: "header", along: 0.5 },
            server: "israphel",
            showShared: false,
        })
    })
})

describe("useTimers", () => {
    const setup = () => {
        return renderHook(() => {
            return useTimers()
        }).result
    }

    const entry = (result: ReturnType<typeof setup>, id: string) => {
        return result.current.timers.find((item) => item.timer.id === id)
    }

    it("shows only the selected server's faction, plus the Abyss", () => {
        const result = setup()

        act(() => {
            result.current.changeServer("siel")
        })

        const regions = new Set(
            result.current.timers.flatMap((item) => {
                return item.timer.boss ? [item.timer.boss.region] : []
            }),
        )

        expect(regions).toEqual(new Set(["verteron", "abyss"]))

        act(() => {
            result.current.changeServer("israphel")
        })

        const swapped = new Set(
            result.current.timers.flatMap((item) => {
                return item.timer.boss ? [item.timer.boss.region] : []
            }),
        )

        expect(swapped).toEqual(new Set(["altgard", "abyss"]))
    })

    it("shows events and resets on every server", () => {
        const result = setup()

        expect(entry(result, "daily")).toBeDefined()
        expect(entry(result, "rift")).toBeDefined()
    })

    it("uses a local report when it's the only one", async () => {
        const result = setup()

        act(() => {
            result.current.changeServer("siel")
        })
        await act(async () => {
            await result.current.changeBossReport("gartua", { killedAt: 123 })
        })

        expect(entry(result, "gartua")).toMatchObject({
            report: { killedAt: 123 },
            reportSource: "local",
            canClearReport: true,
        })
        expect(mocks.write).not.toHaveBeenCalled()
    })

    it("prefers a newer shared report, not clearable without sharing", () => {
        mocks.shared = {
            "siel/gartua": {
                report: { killedAt: 999 },
                reportedAt: 999,
            },
        }

        const result = setup()

        act(() => {
            result.current.changeServer("siel")
        })

        expect(entry(result, "gartua")).toMatchObject({
            report: { killedAt: 999 },
            reportSource: "shared",
            canClearReport: false,
        })
    })

    it("shares a reporter's report and drops the local copy", async () => {
        mocks.auth = REPORTER
        mocks.write.mockResolvedValue(true)

        const result = setup()

        act(() => {
            result.current.changeServer("siel")
            result.current.changeShowShared(true)
        })
        await act(async () => {
            await result.current.changeBossReport("gartua", { killedAt: 5 })
        })

        expect(mocks.write).toHaveBeenCalledWith("siel", "gartua", {
            killedAt: 5,
        })
        expect(result.current.settings.bossReports.gartua).toBeUndefined()
    })

    it("keeps the report locally when the database refuses", async () => {
        mocks.auth = REPORTER
        mocks.write.mockResolvedValue(false)

        const result = setup()

        act(() => {
            result.current.changeServer("siel")
            result.current.changeShowShared(true)
        })
        await act(async () => {
            await result.current.changeBossReport("gartua", { killedAt: 5 })
        })

        expect(result.current.settings.bossReports.gartua).toEqual({
            killedAt: 5,
        })
    })

    it("stays local with sharing off, even for a reporter", async () => {
        mocks.auth = REPORTER

        const result = setup()

        act(() => {
            result.current.changeShowShared(false)
        })

        expect(result.current.canShare).toBe(false)

        await act(async () => {
            await result.current.changeBossReport("gartua", { killedAt: 5 })
        })

        expect(mocks.write).not.toHaveBeenCalled()
    })

    it("builds pinned columns, skipping other factions' timers", () => {
        const result = setup()

        act(() => {
            result.current.changeServer("siel")
            result.current.changePinnedColumns([
                ["gartua", "immortal-gartua"],
                ["rift"],
            ])
        })

        const ids = result.current.pinnedColumns.map((column) => {
            return column.map((item) => item.timer.id)
        })

        expect(ids.flat()).toContain("rift")
        expect(ids.flat().length).toBeLessThan(3)
    })

    it("limits Coming next to its count", () => {
        const result = setup()

        act(() => {
            result.current.changeComingNextCount(2)
        })

        expect(result.current.comingNext.length).toBeLessThanOrEqual(2)
    })
})
