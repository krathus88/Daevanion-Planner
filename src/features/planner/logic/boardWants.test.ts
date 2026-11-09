import { beforeAll, describe, expect, it } from "vitest"
import {
    loadClassPreset,
    type ClassAbility,
    type ClassPreset,
} from "@config/classPresets"
import { layouts } from "@planner/config/layouts"
import { DEFAULT_SPECIAL_PRIORITIES } from "@planner/storage/specialPriorities"
import {
    boardWants,
    resolveWants,
    wantRank,
    type BoardWant,
} from "./boardWants"

let preset: ClassPreset

beforeAll(async () => {
    preset = await loadClassPreset("gladiator")
})

const skill = (id: string): BoardWant => {
    return {
        id: id,
        kind: "skill",
        ability: { id: id } as ClassAbility,
        keys: [],
    }
}

const special: BoardWant = {
    id: "special:combat-speed",
    kind: "special",
    bonus: "combat-speed",
    keys: [],
}

describe("boardWants", () => {
    it("lists specials first, then abilities in preset order", () => {
        const wants = boardWants(preset, "nezekan")
        const firstAbility = wants.findIndex((want) => want.kind !== "special")

        for (const want of wants.slice(firstAbility)) {
            expect(want.kind).not.toBe("special")
        }

        expect(firstAbility).toBeGreaterThan(0)
    })

    it("groups all of an ability's nodes", () => {
        const assignments = preset.assignments.nezekan ?? {}

        for (const want of boardWants(preset, "nezekan")) {
            if (want.kind !== "special") {
                for (const key of want.keys) {
                    expect(assignments[key]).toBe(want.id)
                }
            }
        }
    })

    it("covers every special node with a bonus", () => {
        const wants = boardWants(preset, "nezekan")
        const covered = wants
            .filter((want) => want.kind === "special")
            .flatMap((want) => want.keys)

        expect(covered.sort()).toEqual(
            Object.keys(layouts.nezekan.specialNodeBonuses).sort(),
        )
    })

    it("has no abilities on Ariel", () => {
        expect(
            boardWants(preset, "ariel").filter(
                (want) => want.kind !== "special",
            ),
        ).toEqual([])
    })
})

describe("wantRank", () => {
    it("reads an ability's priority, or last place without one", () => {
        const priorities = { a: 3 }

        expect(
            wantRank(skill("a"), priorities, DEFAULT_SPECIAL_PRIORITIES),
        ).toBe(3)
        expect(
            wantRank(skill("b"), priorities, DEFAULT_SPECIAL_PRIORITIES),
        ).toBe(Number.MAX_SAFE_INTEGER)
    })

    it("reads a special's priority", () => {
        expect(
            wantRank(
                special,
                {},
                {
                    ...DEFAULT_SPECIAL_PRIORITIES,
                    "combat-speed": 9,
                },
            ),
        ).toBe(9)
    })
})

describe("resolveWants", () => {
    it("defaults by rank: Need to 2, Prefer at 3, then Skip", () => {
        const wants = ["a", "b", "c", "d"].map(skill)
        const resolved = resolveWants({
            wants: wants,
            choices: {},
            priorities: { a: 1, b: 2, c: 3, d: 4 },
            specialPriorities: DEFAULT_SPECIAL_PRIORITIES,
        })

        expect([...resolved.values()]).toEqual([
            "need",
            "need",
            "prefer",
            "skip",
        ])
    })

    it("lets the user's choice win", () => {
        const resolved = resolveWants({
            wants: [skill("a")],
            choices: { a: "skip" },
            priorities: { a: 1 },
            specialPriorities: DEFAULT_SPECIAL_PRIORITIES,
        })

        expect(resolved.get("a")).toBe("skip")
    })

    it("defaults an ability skipped on All boards to Skip, unless chosen", () => {
        const resolved = resolveWants({
            wants: [skill("a"), skill("b")],
            choices: { b: "need" },
            priorities: { a: 1, b: 1 },
            specialPriorities: DEFAULT_SPECIAL_PRIORITIES,
            skips: { a: true, b: true },
        })

        expect(resolved.get("a")).toBe("skip")
        expect(resolved.get("b")).toBe("need")
    })

    it("defaults a special node skipped on All boards to Skip", () => {
        const resolved = resolveWants({
            wants: [special],
            choices: {},
            priorities: {},
            specialPriorities: DEFAULT_SPECIAL_PRIORITIES,
            specialSkips: { "combat-speed": true },
        })

        expect(resolved.get(special.id)).toBe("skip")
    })
})
