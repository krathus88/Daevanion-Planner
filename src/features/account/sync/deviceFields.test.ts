import { describe, expect, it } from "vitest"
import { toAccountValue, withDeviceFields } from "./deviceFields"
import { PETS_KEY, TIMERS_KEY } from "./syncedKeys"

describe("toAccountValue", () => {
    it("strips device fields from timer settings", () => {
        expect(
            toAccountValue(TIMERS_KEY, {
                pinned: [],
                showPinned: true,
                comingNext: {},
                showComingNext: true,
                comingNextCount: 4,
                comingNextPosition: null,
                colors: { rift: "red" },
            }),
        ).toEqual({ colors: { rift: "red" } })
    })

    it("leaves other keys alone", () => {
        const value = { pinned: [] }

        expect(toAccountValue(PETS_KEY, value)).toBe(value)
    })

    it("passes through values that aren't objects", () => {
        expect(toAccountValue(TIMERS_KEY, null)).toBe(null)
    })
})

describe("withDeviceFields", () => {
    it("takes account fields but keeps this device's own", () => {
        expect(
            withDeviceFields(
                TIMERS_KEY,
                { colors: { a: 1 }, pinned: ["from account"] },
                { colors: { a: 2 }, pinned: ["mine"], showPinned: false },
            ),
        ).toEqual({
            colors: { a: 1 },
            pinned: ["mine"],
            showPinned: false,
        })
    })

    it("doesn't take a device field the device doesn't have", () => {
        expect(
            withDeviceFields(TIMERS_KEY, { pinned: ["from account"] }, {}),
        ).toEqual({})
    })

    it("copes with an unreadable local value", () => {
        expect(withDeviceFields(TIMERS_KEY, { colors: {} }, null)).toEqual({
            colors: {},
        })
    })

    it("leaves other keys alone", () => {
        const value = { pinned: [] }

        expect(withDeviceFields(PETS_KEY, value, { pinned: [1] })).toBe(value)
    })
})
