import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it } from "vitest"
import { loadClassPreset, type ClassPreset } from "@config/classPresets"
import { readAbilitySkips } from "@planner/storage/abilityPriorities"
import { renderWithChakra } from "@test/renderWithChakra"
import { AbilityPriorityList } from "./AbilityPriorityList"

let preset: ClassPreset

beforeAll(async () => {
    preset = await loadClassPreset("gladiator")
})

describe("AbilityPriorityList", () => {
    it("skips an ability, locking its fields, and brings it back", async () => {
        renderWithChakra(<AbilityPriorityList classPreset={preset} />)

        const ability = preset.abilities[0]
        const toggle = screen.getByRole("button", {
            name: `Skip ${ability.name}`,
        })
        const rank = screen.getByLabelText(`${ability.name} priority rank`)

        expect(toggle).toHaveAttribute("aria-pressed", "false")
        expect(rank).toBeEnabled()

        await userEvent.click(toggle)

        expect(readAbilitySkips(preset)[ability.id]).toBe(true)
        expect(toggle).toHaveAttribute("aria-pressed", "true")
        expect(rank).toBeDisabled()
        expect(
            screen.getByLabelText(`${ability.name} maximum upgrades`),
        ).toBeDisabled()

        await userEvent.click(toggle)

        expect(readAbilitySkips(preset)[ability.id]).toBeUndefined()
        expect(rank).toBeEnabled()
    })

    it("starts abilities with a preset rank of 90+ skipped", () => {
        const late = preset.abilities.find(
            (ability) => (ability.priority ?? 0) >= 90,
        )
        if (!late) {
            throw new Error("Gladiator has no ability ranked 90+.")
        }

        renderWithChakra(<AbilityPriorityList classPreset={preset} />)

        expect(
            screen.getByRole("button", { name: `Skip ${late.name}` }),
        ).toHaveAttribute("aria-pressed", "true")
    })
})
