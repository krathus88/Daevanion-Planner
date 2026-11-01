// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import {
    readPetCollection,
    subscribeToPetCollection,
    writePetCollection,
    type PetCollection,
} from "./petCollection"

const KEY = "daevanion:pets:v1:collection"

const collection = (overrides: Partial<PetCollection> = {}): PetCollection => {
    return {
        levels: {},
        souls: {},
        hiddenLevels: [],
        minimized: false,
        listMinimized: false,
        tipDismissed: false,
        ...overrides,
    }
}

const readStored = (value: unknown) => {
    localStorage.setItem(KEY, JSON.stringify(value))

    return readPetCollection()
}

afterEach(() => {
    vi.restoreAllMocks()
    // A failed save stays cached under raw null. Reading other text drops it,
    // so it can't leak into the next test.
    localStorage.setItem(KEY, "{}")
    readPetCollection()
    localStorage.clear()
})

describe("readPetCollection", () => {
    it("starts empty", () => {
        expect(readPetCollection()).toEqual(collection())
    })

    it("falls back to the defaults on bad data", () => {
        localStorage.setItem(KEY, "not json")
        expect(readPetCollection()).toEqual(collection())

        localStorage.setItem(KEY, "[]")
        expect(readPetCollection()).toEqual(collection())
    })

    it("returns the same object until the data changes", () => {
        readStored({ levels: { 1: 1 } })

        expect(readPetCollection()).toBe(readPetCollection())
    })

    it("drops unknown levels", () => {
        expect(readStored({ levels: { 1: 2, 2: 9, 3: "x" } }).levels).toEqual({
            1: 2,
        })
    })

    it("converts soul counts from old saves into levels", () => {
        expect(readStored({ souls: { 1: 30, 2: 2, 3: "x" } }).levels).toEqual({
            1: 2,
        })
    })

    it("keeps souls that agree with the level", () => {
        expect(
            readStored({ levels: { 1: 2 }, souls: { 1: 40 } }).souls,
        ).toEqual({ 1: 40 })
    })

    it("drops souls that disagree: the level wins", () => {
        const stored = readStored({ levels: { 1: 3 }, souls: { 1: 40 } })

        expect(stored.levels).toEqual({ 1: 3 })
        expect(stored.souls).toEqual({})
    })

    it("lets a locked pet keep up to 4 souls", () => {
        expect(readStored({ levels: {}, souls: { 1: 4 } }).souls).toEqual({
            1: 4,
        })
    })

    it("reads hideUnlocked from old saves as all levels hidden", () => {
        expect(readStored({ hideUnlocked: true }).hiddenLevels).toEqual([
            1, 2, 3,
        ])
    })

    it("cleans up hidden levels", () => {
        expect(readStored({ hiddenLevels: [3, 1, 3, 9] }).hiddenLevels).toEqual(
            [1, 3],
        )
    })

    it("only takes true for its flags", () => {
        expect(readStored({ minimized: "yes" }).minimized).toBe(false)
        expect(readStored({ minimized: true }).minimized).toBe(true)
    })
})

describe("writePetCollection", () => {
    it("round-trips and notifies subscribers", () => {
        const listener = vi.fn()
        const unsubscribe = subscribeToPetCollection(listener)
        const value = collection({ levels: { 1: 2 }, souls: { 1: 31 } })

        writePetCollection(value)
        unsubscribe()
        writePetCollection(collection())

        expect(listener).toHaveBeenCalledTimes(1)
        localStorage.setItem(KEY, JSON.stringify(value))
        expect(readPetCollection()).toEqual(value)
    })

    it("reacts to other tabs", () => {
        const listener = vi.fn()
        const unsubscribe = subscribeToPetCollection(listener)

        window.dispatchEvent(new StorageEvent("storage", { key: "other" }))
        expect(listener).not.toHaveBeenCalled()

        window.dispatchEvent(new StorageEvent("storage", { key: KEY }))
        expect(listener).toHaveBeenCalledTimes(1)

        unsubscribe()
    })

    it("keeps a change in memory when nothing was saved and storage is full", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full")
        })
        const value = collection({ tipDismissed: true })

        writePetCollection(value)

        expect(readPetCollection()).toBe(value)
    })

    it("keeps a change in memory when an older save exists", () => {
        localStorage.setItem(KEY, "{}")
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full")
        })
        const value = collection({ tipDismissed: true })

        writePetCollection(value)

        expect(readPetCollection().tipDismissed).toBe(true)
    })
})
