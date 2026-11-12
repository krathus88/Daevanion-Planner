import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { NewGameCharacter } from "@account/game/gameCharacters"
import { renderWithChakra } from "@test/renderWithChakra"
import { NewCharacterDialog } from "./NewCharacterDialog"

const KRYX: NewGameCharacter = {
    key: "1301:Kryx",
    name: "Kryx",
    server: "siel",
    classId: "cleric",
}

const KRATHUS: NewGameCharacter = {
    key: "1301:Krathus",
    name: "Krathus",
    server: "siel",
    classId: "gladiator",
}

const renderDialog = (characters: NewGameCharacter[]) => {
    const onAdd = vi.fn()
    const onDecline = vi.fn()

    renderWithChakra(
        <NewCharacterDialog
            characters={characters}
            onAdd={onAdd}
            onDecline={onDecline}
        />,
    )

    return { onAdd: onAdd, onDecline: onDecline }
}

describe("NewCharacterDialog", () => {
    it("asks before adding a character from the game", async () => {
        const { onAdd } = renderDialog([KRYX])

        expect(screen.getByRole("dialog")).toHaveTextContent(
            "The companion app saw Kryx (Cleric, Siel). Add it to the tracker?",
        )

        await userEvent.click(screen.getByRole("button", { name: "Add" }))

        expect(onAdd).toHaveBeenCalledWith(KRYX)
    })

    it("declines it", async () => {
        const { onDecline } = renderDialog([KRYX])

        await userEvent.click(screen.getByRole("button", { name: "Don't add" }))

        expect(onDecline).toHaveBeenCalledWith(KRYX)
    })

    it("asks about the next one once closed, and not again this visit", async () => {
        renderDialog([KRYX, KRATHUS])

        await userEvent.click(screen.getByRole("button", { name: "Close" }))

        expect(await screen.findByRole("dialog")).toHaveTextContent("Krathus")
    })

    it("shows nothing without new characters", () => {
        renderDialog([])

        expect(screen.queryByRole("dialog")).toBeNull()
    })
})
