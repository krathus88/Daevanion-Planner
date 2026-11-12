import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { CharacterSelect } from "./CharacterSelect"

const CHARACTERS = [
    { name: "Alpha", classId: "cleric" as const },
    // A class number the site doesn't know yet: no icon.
    { name: "Beta", classId: null },
]

describe("CharacterSelect", () => {
    // jsdom lacks what Chakra's Select uses to place and scroll its list.
    beforeAll(() => {
        vi.stubGlobal(
            "ResizeObserver",
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        )
        Element.prototype.scrollTo = () => {}
    })

    it("offers only the characters, and no character", async () => {
        const onChange = vi.fn()

        renderWithChakra(
            <CharacterSelect
                value={null}
                characters={CHARACTERS}
                onChange={onChange}
            />,
        )

        await userEvent.click(
            screen.getByRole("combobox", { name: "Character" }),
        )

        expect(
            screen.getAllByRole("option").map((option) => option.textContent),
        ).toEqual(["No character", "Alpha", "Beta"])

        await userEvent.click(screen.getByRole("option", { name: "Beta" }))

        expect(onChange).toHaveBeenLastCalledWith("Beta")
    })

    it("shows the character's class icon and reports no character as null", async () => {
        const onChange = vi.fn()

        renderWithChakra(
            <CharacterSelect
                value="Alpha"
                characters={CHARACTERS}
                onChange={onChange}
            />,
        )

        const trigger = screen.getByRole("combobox", { name: "Character" })

        expect(trigger).toHaveTextContent("Alpha")
        expect(trigger.querySelector("img")).not.toBeNull()

        await userEvent.click(trigger)
        await userEvent.click(
            screen.getByRole("option", { name: "No character" }),
        )

        expect(onChange).toHaveBeenLastCalledWith(null)
    })
})
