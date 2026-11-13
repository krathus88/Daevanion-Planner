import { describe, expect, it } from "vitest"
import { STARTER_TASKS } from "@tracker/config/starterTasks"
import type { TrackerCharacter, TrackerData } from "@tracker/types"
import {
    CUBE_KEYS_LOCK,
    ENERGY_LOCK,
    getCompanionLocks,
    hasGameSection,
} from "./companionLocks"

const CHARACTERS: TrackerCharacter[] = [
    { id: "a", name: "Kryx", classId: "cleric", server: "siel" },
    { id: "b", name: "Other", classId: "templar", server: "siel" },
]

// Kryx's arena week (period 5) has a known start.
const ARENA: TrackerData["arena"] = {
    a: {
        seen: { period: 5, at: 2, modes: { "2": [18, 21] } },
        base: { period: 5, at: 1, modes: { "2": [17, 20] } },
    },
}

const locked = (sections: string[], week = 5) => {
    const locks = getCompanionLocks(
        sections.join("\n"),
        CHARACTERS,
        STARTER_TASKS,
        ARENA,
        week,
    )

    return Object.fromEntries(
        Object.entries(locks).map(([owner, ids]) => [owner, [...ids].sort()]),
    )
}

describe("getCompanionLocks", () => {
    it("locks the Corridors task once the entrances are read", () => {
        expect(locked(["1301:kryx:corridors"])).toEqual({ a: ["corridors"] })
    })

    it("locks what each section fills, under its owner", () => {
        expect(
            locked([
                "1301:kryx:counters",
                "1301:kryx:items",
                "1301:kryx:supply",
                "1301:kryx:duty",
                "1301:kryx:arena",
                "1301:kryx:crafts.31070001",
                "1301:kryx:crafts.31070002",
            ]),
        ).toEqual({
            a: [
                "arena-1v1-participation",
                "arena-1v1-wins",
                "arena-participation",
                "arena-wins",
                "ascension-trial",
                CUBE_KEYS_LOCK,
                ENERGY_LOCK,
                "nightmare",
                "odyle-craft",
                "supply-requests",
            ].sort(),
            "server:siel": [
                "duty-missions",
                "invasion",
                "odyle-craft-server",
                "shugo-festival",
                "unknown-fissure",
            ],
        })
    })

    it("locks arena tasks only in a week whose start is known", () => {
        expect(locked(["1301:Kryx:arena"], 6)).toEqual({})
    })

    it("locks nothing for characters it hasn't sent", () => {
        expect(locked(["1302:kryx:counters", "1301:nobody:items", ""])).toEqual(
            {},
        )
    })

    it("locks only the crafting tasks whose recipe it has", () => {
        expect(locked(["1301:Kryx:crafts.31070002"])).toEqual({
            a: ["odyle-craft"],
        })
    })
})

describe("hasGameSection", () => {
    const sections = "1301:Kryx:items\n1302:Zed:pets"

    it("finds a section on any server", () => {
        expect(hasGameSection(sections, "pets")).toBe(true)
        expect(hasGameSection(sections, "counters")).toBe(false)
    })

    it("finds a section on one server", () => {
        expect(hasGameSection(sections, "items", "siel")).toBe(true)
        expect(hasGameSection(sections, "pets", "siel")).toBe(false)
    })

    it("finds nothing without snapshots", () => {
        expect(hasGameSection("", "items")).toBe(false)
    })
})

describe("hasGameSection for one character", () => {
    it("matches only that character's lines", () => {
        const sections = "1301:Kryx:professions\n1301:Krathus:items"

        expect(hasGameSection(sections, "professions", "siel", "Kryx")).toBe(
            true,
        )
        expect(hasGameSection(sections, "professions", "siel", "Krathus")).toBe(
            false,
        )
        expect(hasGameSection(sections, "professions", "siel", "")).toBe(false)
    })
})
