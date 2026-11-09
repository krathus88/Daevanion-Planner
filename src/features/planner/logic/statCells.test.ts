import { describe, expect, it } from "vitest"
import { layouts } from "@planner/config/layouts"
import { statCells } from "./statCells"

const kindOf = (layoutName: "ariel" | "nezekan", key: string) => {
    return layouts[layoutName].nodeStats[key]
}

describe("statCells", () => {
    it("finds a main board stat's nodes", () => {
        const cells = statCells(layouts.nezekan, "attack")

        expect(cells.size).toBeGreaterThan(0)
        for (const key of cells) {
            expect(kindOf("nezekan", key)).toBe("attack")
        }
    })

    it("counts an Ariel combined node for both of its stats", () => {
        const attack = statCells(layouts.ariel, "pve-attack")
        const defense = statCells(layouts.ariel, "pve-defense")
        const combined = [...attack].filter((key) => {
            return kindOf("ariel", key) === "pve-attack-defense"
        })

        expect(combined.length).toBeGreaterThan(0)
        for (const key of combined) {
            expect(defense.has(key)).toBe(true)
        }
    })

    it("finds Ariel's special nodes by their stat", () => {
        const cells = statCells(layouts.ariel, "boss-damage-boost")

        expect(cells.size).toBe(4)
    })

    it("finds a main board special node by its bonus", () => {
        const cells = statCells(layouts.nezekan, "combat-speed")

        expect(cells.size).toBeGreaterThan(0)
        for (const key of cells) {
            expect(layouts.nezekan.specialNodeBonuses[key]).toBe("combat-speed")
        }
    })

    it("finds nothing for a stat the board doesn't have", () => {
        expect(statCells(layouts.nezekan, "pve-attack").size).toBe(0)
    })
})
