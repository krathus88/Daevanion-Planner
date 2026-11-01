// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_BOARD_ID } from "@config/boards"
import { DEFAULT_CLASS_ID, type ClassId } from "@config/classPresets"
import {
    readPlannerLocation,
    subscribeToPlannerLocation,
    writePlannerLocation,
} from "./plannerLocation"

const KEY = "daevanion:planner-location"
const DEFAULT = { classId: DEFAULT_CLASS_ID, layout: DEFAULT_BOARD_ID }
const OTHER_CLASS: ClassId =
    DEFAULT_CLASS_ID === "cleric" ? "gladiator" : "cleric"

afterEach(() => {
    vi.restoreAllMocks()
    // A failed save stays cached under raw null. Reading other text drops it,
    // so it can't leak into the next test.
    localStorage.setItem(KEY, "{}")
    readPlannerLocation()
    localStorage.clear()
})

describe("readPlannerLocation", () => {
    it("defaults without a save", () => {
        expect(readPlannerLocation()).toEqual(DEFAULT)
    })

    it.each([
        "{",
        "[]",
        '{"classId":"nobody","layout":"zikel"}',
        `{"classId":"${DEFAULT_CLASS_ID}","layout":"azphel"}`,
    ])("defaults on %s", (raw) => {
        localStorage.setItem(KEY, raw)

        expect(readPlannerLocation()).toEqual(DEFAULT)
    })

    it("returns the same object until the data changes", () => {
        expect(readPlannerLocation()).toBe(readPlannerLocation())
    })
})

describe("writePlannerLocation", () => {
    it("saves and notifies", () => {
        const listener = vi.fn()
        const unsubscribe = subscribeToPlannerLocation(listener)
        const location = { classId: OTHER_CLASS, layout: "zikel" as const }

        writePlannerLocation(location)
        unsubscribe()

        expect(readPlannerLocation()).toEqual(location)
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it("does nothing when the location is unchanged", () => {
        const listener = vi.fn()
        const unsubscribe = subscribeToPlannerLocation(listener)

        writePlannerLocation(DEFAULT)
        unsubscribe()

        expect(listener).not.toHaveBeenCalled()
        expect(localStorage.getItem(KEY)).toBeNull()
    })

    it("keeps a location in memory when storage is blocked and empty", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full")
        })
        const location = { classId: OTHER_CLASS, layout: "zikel" as const }

        writePlannerLocation(location)

        expect(readPlannerLocation()).toEqual(location)
    })

    it("keeps a location in memory when an older save exists", () => {
        localStorage.setItem(
            KEY,
            JSON.stringify({ classId: OTHER_CLASS, layout: "vaizel" }),
        )
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full")
        })
        const location = { classId: OTHER_CLASS, layout: "zikel" as const }

        writePlannerLocation(location)

        expect(readPlannerLocation()).toEqual(location)
    })
})
