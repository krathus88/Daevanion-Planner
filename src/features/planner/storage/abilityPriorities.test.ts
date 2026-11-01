// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import type { ClassPreset } from "@config/classPresets"
import { writeBoardProgress } from "./boardStorage"
import {
    abilityNodeCounts,
    defaultAbilityPriorities,
    readAbilityMaximums,
    readAbilityMinimums,
    readAbilityPriorities,
    readSharedAbilityUpgradeCounts,
    resolveAbilityMinimums,
    writeAbilityMaximums,
    writeAbilityMinimums,
    writeAbilityPriorities,
} from "./abilityPriorities"
import { readAllClassSettings, writeClassSettings } from "./classSettings"

const preset = {
    id: "gladiator",
    abilities: [
        { id: "a", priority: 7 },
        { id: "b" },
        { id: "c" },
        { id: "d" },
        { id: "e" },
    ],
    assignments: {
        nezekan: { "0,0": "a", "0,1": "a", "0,2": "a", "1,0": "b" },
        zikel: { "0,0": "a", "1,0": "b", "2,0": "b", "3,0": "c" },
    },
} as unknown as ClassPreset

afterEach(() => {
    localStorage.clear()
})

describe("priorities", () => {
    it("defaults to the preset's rank, or list position + 2", () => {
        expect(defaultAbilityPriorities(preset)).toMatchObject({
            a: 7,
            b: 3,
            c: 4,
        })
    })

    it("round-trips", () => {
        expect(writeAbilityPriorities("gladiator", { a: 1, b: 2 })).toBeNull()
        expect(readAbilityPriorities(preset)).toMatchObject({ a: 1, b: 2 })
    })

    it.each([0, -1, 1.5, "1"])("ignores a saved rank of %s", (priority) => {
        writeClassSettings("gladiator", "abilities", {
            a: { priority: priority },
        })

        expect(readAbilityPriorities(preset).a).toBe(7)
    })

    it("reads from a given source", () => {
        expect(
            readAbilityPriorities(preset, {
                abilities: { a: { priority: 2 } },
            }).a,
        ).toBe(2)
    })

    it("explains unreadable settings", () => {
        writeClassSettings("gladiator", "abilities", 5)

        expect(() => {
            return readAbilityPriorities(preset)
        }).toThrow("Could not read ability priorities")
    })

    it("ignores abilities the class no longer has", () => {
        writeClassSettings("gladiator", "abilities", {
            gone: { priority: 1 },
        })

        expect(readAbilityPriorities(preset)).not.toHaveProperty("gone")
    })
})

describe("minimums and maximums", () => {
    it("are stored per field without touching the others", () => {
        writeAbilityPriorities("gladiator", { a: 1 })
        writeAbilityMinimums("gladiator", { a: 2 })
        writeAbilityMaximums("gladiator", { a: 3 })

        expect(readAbilityPriorities(preset).a).toBe(1)
        expect(readAbilityMinimums(preset)).toEqual({ a: 2 })
        expect(readAbilityMaximums(preset)).toEqual({ a: 3 })
    })

    it("drop a value when it's left out", () => {
        writeAbilityMaximums("gladiator", { a: 3 })
        writeAbilityMaximums("gladiator", {})

        expect(readAbilityMaximums(preset)).toEqual({})
        expect(readAllClassSettings("gladiator")).toEqual({
            abilities: { a: {} },
        })
    })

    it("allow 0 but no negative or fractional values", () => {
        writeClassSettings("gladiator", "abilities", {
            a: { min: 0, max: 0 },
            b: { min: -1, max: 1.5 },
        })

        expect(readAbilityMinimums(preset)).toEqual({ a: 0 })
        expect(readAbilityMaximums(preset)).toEqual({ a: 0 })
    })

    it("replace an unreadable save", () => {
        writeClassSettings("gladiator", "abilities", 5)

        expect(writeAbilityMinimums("gladiator", { a: 1 })).toBeNull()
        expect(readAbilityMinimums(preset)).toEqual({ a: 1 })
    })
})

describe("abilityNodeCounts", () => {
    it("counts across all boards", () => {
        const counts = abilityNodeCounts(preset)

        expect(counts.get("a")).toBe(4)
        expect(counts.get("b")).toBe(3)
    })

    it("counts only the boards given", () => {
        expect(abilityNodeCounts(preset, ["zikel"]).get("a")).toBe(1)
    })
})

describe("resolveAbilityMinimums", () => {
    it("defaults to every node at rank 1, 2 at ranks 2-4, then 0", () => {
        expect(
            resolveAbilityMinimums(preset, { a: 1, b: 2, c: 4, d: 5 }, {}),
        ).toEqual({ a: 4, b: 2, c: 1, d: 0, e: 0 })
    })

    it("uses stored values, capped at the node count", () => {
        expect(
            resolveAbilityMinimums(preset, { a: 1 }, { a: 2, b: 99 }),
        ).toMatchObject({ a: 2, b: 3 })
    })
})

describe("readSharedAbilityUpgradeCounts", () => {
    it("counts abilities on the planned routes", () => {
        writeBoardProgress("gladiator", "nezekan", {
            selectedCells: [],
            availablePoints: 0,
            targetCells: [],
            plannedPath: ["0,0", "0,1", "1,0", "9,9"],
            plannedCost: 0,
        })

        const counts = readSharedAbilityUpgradeCounts(preset)

        expect(counts.get("a")).toBe(2)
        expect(counts.get("b")).toBe(1)
    })

    it("throws when a board can't be read", () => {
        localStorage.setItem("daevanion:v1:gladiator:nezekan:progress", "{")

        expect(() => {
            return readSharedAbilityUpgradeCounts(preset)
        }).toThrow("Could not read")
    })
})
