import { describe, expect, it } from "vitest"
import type { ClassAbility } from "@config/classPresets"
import { makeLayout } from "@test/boardFixture"
import { countNodeNames, getNodeName } from "./nodeName"

const ability = { id: "a", name: "Slash" } as unknown as ClassAbility

describe("getNodeName", () => {
    it("prefers the ability, then the stat, then the bonus", () => {
        expect(getNodeName(ability, "attack", "combat-speed")).toBe("Slash")
        expect(getNodeName(undefined, "attack", "combat-speed")).toBe("Attack")
        expect(getNodeName(undefined, undefined, "combat-speed")).toBe(
            "Combat Speed",
        )
    })

    it("is undefined with nothing to name it by", () => {
        expect(getNodeName(undefined, undefined, undefined)).toBeUndefined()
    })
})

describe("countNodeNames", () => {
    const layout = makeLayout(undefined, {
        nodeStats: { "0,1": "attack", "1,1": "attack", "2,1": "defense" },
    })

    it("counts repeats, in first-seen order", () => {
        expect(countNodeNames(layout, {}, ["2,1", "0,1", "1,1"])).toEqual([
            "Defense",
            "Attack ×2",
        ])
    })

    it("uses assigned abilities", () => {
        expect(countNodeNames(layout, { "0,2": ability }, ["0,2"])).toEqual([
            "Slash",
        ])
    })

    it("falls back to the node's type", () => {
        expect(countNodeNames(layout, {}, ["2,2"])).toEqual(["Special"])
    })

    it("is empty for no keys", () => {
        expect(countNodeNames(layout, {}, [])).toEqual([])
    })
})
