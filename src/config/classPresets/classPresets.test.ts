import { describe, expect, it } from "vitest"
import { BOARD_IDS, MAIN_BOARD_IDS } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import { resolveAbilitiesByPosition } from "@planner/logic/abilityAssignments"
import { CLASS_IDS, CLASS_NAMES, isClassId, loadClassPreset } from "./index"

describe("class info", () => {
    it("knows its eight classes", () => {
        expect(CLASS_IDS).toHaveLength(8)
    })

    it("recognises class ids", () => {
        expect(isClassId("spirit-master")).toBe(true)
        expect(isClassId("toString")).toBe(false)
        expect(isClassId("nobody")).toBe(false)
    })
})

describe.each(CLASS_IDS)("%s preset", (classId) => {
    it("matches its id and name", async () => {
        const preset = await loadClassPreset(classId)

        expect(preset.id).toBe(classId)
        expect(preset.name).toBe(CLASS_NAMES[classId])
    })

    it("has unique ability ids", async () => {
        const preset = await loadClassPreset(classId)
        const ids = preset.abilities.map((ability) => ability.id)

        expect(new Set(ids).size).toBe(ids.length)
    })

    it("gives every ability an icon and a tooltip", async () => {
        const preset = await loadClassPreset(classId)

        for (const ability of preset.abilities) {
            expect(ability.icon, ability.id).toBeTruthy()
            expect(ability.tooltip, ability.id).toBeTruthy()
        }
    })

    it("assigns abilities only to nodes of their type", async () => {
        const preset = await loadClassPreset(classId)

        for (const board of BOARD_IDS) {
            expect(() => {
                return resolveAbilitiesByPosition(layouts[board], board, preset)
            }).not.toThrow()
        }
    })

    it("assigns every ability somewhere", async () => {
        const preset = await loadClassPreset(classId)
        const assigned = new Set<string>()

        for (const board of MAIN_BOARD_IDS) {
            for (const abilityId of Object.values(
                preset.assignments[board] ?? {},
            )) {
                assigned.add(abilityId)
            }
        }

        for (const ability of preset.abilities) {
            expect(assigned.has(ability.id), ability.id).toBe(true)
        }
    })
})
