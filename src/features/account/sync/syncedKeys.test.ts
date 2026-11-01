import { describe, expect, it } from "vitest"
import {
    getPlannerClassId,
    isPlannerKey,
    isSyncedKey,
    PETS_KEY,
    TIMERS_KEY,
} from "./syncedKeys"

describe("isSyncedKey", () => {
    it.each([
        PETS_KEY,
        TIMERS_KEY,
        "daevanion:v1:gladiator:nezekan:saved-boards",
        "daevanion:v1:gladiator:shared-allocation",
        "daevanion:v1:gladiator:settings",
    ])("syncs %s", (key) => {
        expect(isSyncedKey(key)).toBe(true)
    })

    it.each([
        "daevanion:v1:gladiator:nezekan:board-undo",
        "daevanion:v1:gladiator:nezekan:planner-undo",
        "daevanion:planner-location",
        "daevanion:priorities-open:board",
        "daevanion:sync:v1:state",
        "something-else",
    ])("keeps %s on the device", (key) => {
        expect(isSyncedKey(key)).toBe(false)
    })
})

describe("planner keys", () => {
    it("recognises the prefix", () => {
        expect(isPlannerKey("daevanion:v1:x")).toBe(true)
        expect(isPlannerKey(PETS_KEY)).toBe(false)
    })

    it("reads the class from a key", () => {
        expect(getPlannerClassId("daevanion:v1:cleric:zikel:x")).toBe("cleric")
    })
})
