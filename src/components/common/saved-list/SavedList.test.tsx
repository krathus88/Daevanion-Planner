import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { SavedList } from "./SavedList"

const setup = (active = false) => {
    const handlers = {
        onLoad: vi.fn(),
        onDelete: vi.fn(),
        onRename: vi.fn(),
    }

    renderWithChakra(
        <SavedList
            items={[{ id: "a", name: "Plan", detail: "5 pts", active: active }]}
            empty="Nothing yet"
            {...handlers}
        />,
    )

    return handlers
}

describe("SavedList", () => {
    it("shows its empty text", () => {
        renderWithChakra(
            <SavedList
                items={[]}
                empty="Nothing yet"
                onLoad={() => {}}
                onDelete={() => {}}
            />,
        )

        expect(screen.getByText("Nothing yet")).toBeInTheDocument()
    })

    it("shows an item and loads and deletes it", async () => {
        const { onLoad, onDelete } = setup()

        expect(screen.getByText("5 pts")).toBeInTheDocument()

        await userEvent.click(screen.getByRole("button", { name: "Load" }))
        await userEvent.click(
            screen.getByRole("button", { name: "Delete Plan" }),
        )

        expect(onLoad).toHaveBeenCalledWith("a")
        expect(onDelete).toHaveBeenCalledWith("a")
    })

    it("offers Reload on the active item", () => {
        setup(true)

        expect(screen.getByRole("button", { name: "Reload" })).toBeVisible()
    })

    it("has no rename without a handler", () => {
        renderWithChakra(
            <SavedList
                items={[{ id: "a", name: "Plan" }]}
                empty=""
                onLoad={() => {}}
                onDelete={() => {}}
            />,
        )

        expect(screen.queryByRole("button", { name: "Rename Plan" })).toBeNull()
    })

    const startRename = async () => {
        await userEvent.click(
            screen.getByRole("button", { name: "Rename Plan" }),
        )

        return screen.getByLabelText("New name for Plan")
    }

    it("renames, trimming the name", async () => {
        const { onRename } = setup()
        const input = await startRename()

        await userEvent.clear(input)
        await userEvent.type(input, "  New {Enter}")

        expect(onRename).toHaveBeenCalledWith("a", "New")
        expect(screen.queryByLabelText("New name for Plan")).toBeNull()
    })

    it("doesn't report an unchanged name", async () => {
        const { onRename } = setup()

        await startRename()
        await userEvent.click(screen.getByRole("button", { name: "Save" }))

        expect(onRename).not.toHaveBeenCalled()
    })

    it("won't save an empty name", async () => {
        const { onRename } = setup()
        const input = await startRename()

        await userEvent.clear(input)

        expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()

        await userEvent.type(input, "{Enter}")

        expect(onRename).not.toHaveBeenCalled()
    })

    it("cancels with the button and with Escape", async () => {
        const { onRename } = setup()

        await startRename()
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
        expect(screen.queryByLabelText("New name for Plan")).toBeNull()

        const input = await startRename()

        await userEvent.type(input, "x{Escape}")
        expect(screen.queryByLabelText("New name for Plan")).toBeNull()
        expect(onRename).not.toHaveBeenCalled()
    })
})
