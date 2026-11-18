import { describe, expect, it } from "vitest"
import { STARTER_TASKS } from "@tracker/config/starterTasks"
import type { TrackerCharacter, TrackerData } from "@tracker/types"
import {
    CUBE_KEYS_LOCK,
    ENERGY_LOCK,
    getCompanionLocks,
    getUnknownLockId,
    hasGameSection,
} from "./companionLocks"
import { SHOP_TASKS } from "./gameIds"

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

// The starter tasks but the shop goals, which lock for every character (their
// own tests below).
const OTHER_TASKS = STARTER_TASKS.filter((task) => {
    return SHOP_TASKS[task.id] === undefined
})

const locked = (sections: string[], week = 5, tasks = OTHER_TASKS) => {
    const locks = getCompanionLocks(
        sections.join("\n"),
        CHARACTERS,
        tasks,
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

    it("locks only the arena tasks set by hand when the week's start is unknown", () => {
        const locks = getCompanionLocks(
            "1301:Kryx:arena",
            CHARACTERS,
            OTHER_TASKS,
            {
                a: {
                    seen: { period: 6, at: 3, modes: { "2": [19, 21] } },
                    fixed: { period: 6, starts: { "arena-wins": 18 } },
                },
            },
            6,
        )

        expect([...(locks.a ?? [])]).toEqual(["arena-wins"])
    })

    it("locks nothing for characters it hasn't sent", () => {
        expect(locked(["1302:kryx:counters", "1301:nobody:items", ""])).toEqual(
            {},
        )
    })

    it("locks the shop goals of every character, marking those with no counts", () => {
        const shopTasks = STARTER_TASKS.filter((task) => {
            return SHOP_TASKS[task.id] !== undefined
        })
        const goals = [
            "crystals-nightmare",
            "crystals-shugo",
            "shards-abyss",
            "shards-nightmare",
            "shards-shugo",
        ]
        const unknown = (...ids: string[]) => ids.map(getUnknownLockId)

        // Kryx opened the Nightmare shop; Other has never been seen.
        expect(locked(["1301:Kryx:shops.990003"], 5, shopTasks)).toEqual({
            a: [
                ...goals,
                ...unknown("crystals-shugo", "shards-abyss", "shards-shugo"),
            ].sort(),
            b: [...goals, ...unknown(...goals)].sort(),
        })
        // Never used: nothing locks.
        expect(locked([], 5, shopTasks)).toEqual({})
    })

    it("locks only the crafting tasks whose recipe it has", () => {
        expect(locked(["1301:Kryx:crafts.31070002"])).toEqual({
            a: ["odyle-craft"],
        })
    })

    it("locks the Odyle shop tasks whose limit it has", () => {
        expect(locked(["1301:Kryx:limits.1209"])).toEqual({
            a: ["odyle-shop"],
        })
        expect(locked(["1301:Kryx:limits.1210"])).toEqual({
            "server:siel": ["odyle-shop-server"],
        })
    })

    it("locks a Command task on any of its entries", () => {
        expect(locked(["1301:Kryx:limits.134019903"])).toEqual({
            "server:siel": ["command-abyss"],
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
