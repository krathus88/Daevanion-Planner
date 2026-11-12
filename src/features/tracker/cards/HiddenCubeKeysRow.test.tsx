import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { HiddenCubeKeysRow } from "./HiddenCubeKeysRow"

describe("HiddenCubeKeysRow", () => {
    it("shows a dash until set", () => {
        renderWithChakra(
            <HiddenCubeKeysRow ownerLabel="Testchar" onChange={vi.fn()} />,
        )

        expect(
            screen.getByRole("button", {
                name: "Hidden Cube keys, Testchar: not set, edit",
            }),
        ).toHaveTextContent("—")
    })

    it("edits the count", async () => {
        const onChange = vi.fn()

        renderWithChakra(
            <HiddenCubeKeysRow
                count={35}
                ownerLabel="Testchar"
                onChange={onChange}
            />,
        )

        await userEvent.click(
            screen.getByRole("button", {
                name: "Hidden Cube keys, Testchar: 35, edit",
            }),
        )

        const field = screen.getByRole("textbox", {
            name: "Hidden Cube keys, Testchar",
        })

        await userEvent.type(field, "7")

        expect(onChange).toHaveBeenLastCalledWith(7)
    })

    it("takes no input while the companion app fills it", () => {
        renderWithChakra(
            <HiddenCubeKeysRow
                count={35}
                ownerLabel="Testchar"
                locked
                onChange={vi.fn()}
            />,
        )

        const button = screen.getByRole("button", {
            name: "Hidden Cube keys, Testchar: 35, edit",
        })

        const lock = screen.getByRole("img", {
            name: "Filled by the companion app",
        })

        expect(button.closest("[inert]")).not.toBeNull()
        // Right-aligned beside Odyle Energy: the lock leads, before the icon.
        expect(lock.parentElement?.firstElementChild).toBe(lock)
    })
})
