// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import {
    readAllClassSettings,
    readClassSettings,
    replaceClassSettings,
    subscribeToClassSettings,
    writeClassSettings,
} from "./classSettings"

const CLASS = "gladiator"
const KEY = `daevanion:v1:${CLASS}:settings`

afterEach(() => {
    localStorage.clear()
})

describe("class settings", () => {
    it("starts empty", () => {
        expect(readAllClassSettings(CLASS)).toEqual({})
        expect(readClassSettings(CLASS, "stats")).toBeUndefined()
    })

    it("writes one section at a time", () => {
        writeClassSettings(CLASS, "stats", { a: 1 })
        writeClassSettings(CLASS, "ariel", { b: 2 })

        expect(readAllClassSettings(CLASS)).toEqual({
            stats: { a: 1 },
            ariel: { b: 2 },
        })
    })

    it("reads a section from a given source", () => {
        expect(readClassSettings(CLASS, "stats", { stats: 5 })).toBe(5)
    })

    it("throws on a save that isn't an object", () => {
        localStorage.setItem(KEY, "5")

        expect(() => {
            return readAllClassSettings(CLASS)
        }).toThrow("invalid")
    })

    it("throws on a save that's an array", () => {
        localStorage.setItem(KEY, "[]")

        expect(() => {
            return readAllClassSettings(CLASS)
        }).toThrow("invalid")
    })

    it("lets a new save replace an unreadable one", () => {
        localStorage.setItem(KEY, "{")

        writeClassSettings(CLASS, "stats", 1)

        expect(readAllClassSettings(CLASS)).toEqual({ stats: 1 })
    })

    it("replaces everything at once", () => {
        writeClassSettings(CLASS, "stats", 1)
        replaceClassSettings(CLASS, { ariel: 2 })

        expect(readAllClassSettings(CLASS)).toEqual({ ariel: 2 })
    })

    it("notifies only this class's subscribers", () => {
        const listener = vi.fn()
        const unsubscribe = subscribeToClassSettings(CLASS, listener)

        writeClassSettings("cleric", "stats", 1)
        expect(listener).not.toHaveBeenCalled()

        writeClassSettings(CLASS, "stats", 1)
        window.dispatchEvent(new StorageEvent("storage", { key: KEY }))
        expect(listener).toHaveBeenCalledTimes(2)

        unsubscribe()
    })
})
