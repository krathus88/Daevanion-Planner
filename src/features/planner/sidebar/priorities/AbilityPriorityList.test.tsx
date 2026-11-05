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

    it("lists skipped abilities after the rest of their group", async () => {
        renderWithChakra(<AbilityPriorityList classPreset={preset} />)

        const skills = preset.abilities.filter(
            (ability) => ability.type === "skill",
        )
        const skillButtons = () => {
            return screen
                .getAllByRole("button", { name: /^Skip / })
                .filter((button) => {
                    return skills.some(
                        (skill) =>
                            button.getAttribute("aria-label") ===
                            `Skip ${skill.name}`,
                    )
                })
        }
        const [top] = skillButtons()

        await userEvent.click(top)

        const after = skillButtons()
        const pressed = after.map(
            (button) => button.getAttribute("aria-pressed") === "true",
        )

        // Every skipped skill comes after every used one.
        expect(pressed).toEqual([...pressed].sort())
        expect(after.indexOf(top)).toBeGreaterThanOrEqual(pressed.indexOf(true))
        expect(after.at(-1)?.getAttribute("aria-pressed")).toBe("true")
    })
})
