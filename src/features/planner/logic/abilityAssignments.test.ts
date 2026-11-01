import { describe, expect, it } from "vitest"
import type { ClassPreset } from "@config/classPresets"
import { makeLayout } from "@test/boardFixture"
import {
    resolveAbilitiesByPosition,
    validateLayoutBonuses,
} from "./abilityAssignments"

const layout = makeLayout()

const preset = (assignments: Record<string, string>) => {
    return {
        name: "Test",
        abilities: [
            { id: "skill", type: "skill" },
            { id: "passive", type: "passive" },
        ],
        assignments: { nezekan: assignments },
    } as unknown as ClassPreset
}

describe("resolveAbilitiesByPosition", () => {
    it("maps node keys to their abilities", () => {
        const abilities = resolveAbilitiesByPosition(
            layout,
            "nezekan",
            preset({ "0,2": "skill", "2,0": "passive" }),
        )

        expect(abilities["0,2"].id).toBe("skill")
        expect(abilities["2,0"].id).toBe("passive")
    })

    it("has nothing for Ariel", () => {
        expect(resolveAbilitiesByPosition(layout, "ariel", preset({}))).toEqual(
            {},
        )
    })

    it.each([
        ["an unknown ability", { "0,2": "nope" }],
        ["the wrong node type", { "0,2": "passive" }],
        ["a basic node", { "0,1": "skill" }],
        ["the start node", { "0,0": "skill" }],
        ["a position off the board", { "99,0": "skill" }],
        ["a bad key", { nonsense: "skill" }],
    ])("throws on %s", (_name, assignments) => {
        expect(() => {
            return resolveAbilitiesByPosition(
                layout,
                "nezekan",
                preset(assignments),
            )
        }).toThrow("Invalid Test ability assignment")
    })
})

describe("validateLayoutBonuses", () => {
    it("accepts stats on basic nodes and bonuses on special ones", () => {
        expect(() => {
            validateLayoutBonuses(
                makeLayout(undefined, {
                    nodeStats: { "0,1": "attack" },
                    specialNodeBonuses: { "2,2": "combat-speed" },
                }),
                "nezekan",
            )
        }).not.toThrow()
    })

    it.each([
        ["a skill node", "0,2", "not a stat node"],
        ["a gap", "1,0", "not a node"],
        ["off the board", "99,99", "not a node"],
    ])("refuses a stat on %s", (_name, key, message) => {
        expect(() => {
            validateLayoutBonuses(
                makeLayout(undefined, { nodeStats: { [key]: "attack" } }),
                "nezekan",
            )
        }).toThrow(message)
    })

    it.each([
        ["a basic node", "0,1", "not a special node"],
        ["a gap", "1,0", "not a node"],
    ])("refuses a bonus on %s", (_name, key, message) => {
        expect(() => {
            validateLayoutBonuses(
                makeLayout(undefined, {
                    specialNodeBonuses: { [key]: "combat-speed" },
                }),
                "nezekan",
            )
        }).toThrow(message)
    })
})
