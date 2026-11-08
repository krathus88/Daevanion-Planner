import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { AppError } from "./AppError"

const reset = () => {}

describe("AppError", () => {
    it("explains the crash, offers a reload and keeps the details folded", async () => {
        const writeText = vi.fn(() => Promise.resolve())

        vi.stubGlobal("navigator", { clipboard: { writeText: writeText } })
        renderWithChakra(<AppError error={new Error("Boom")} reset={reset} />)

        expect(
            screen.getByRole("heading", { name: "Something went wrong" }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: "Reload page" }),
        ).toBeInTheDocument()

        await userEvent.click(
            screen.getByRole("button", { name: "Error details" }),
        )
        expect(await screen.findByText(/Error: Boom/)).toBeVisible()

        await userEvent.click(
            screen.getByRole("button", { name: "Copy details" }),
        )
        expect(writeText).toHaveBeenCalledWith(
            expect.stringContaining("Error: Boom"),
        )
        expect(
            screen.getByRole("button", { name: "Copied" }),
        ).toBeInTheDocument()

        vi.unstubAllGlobals()
    })

    it("asks for a reload, without details, when the site was updated", () => {
        renderWithChakra(
            <AppError
                error={
                    new TypeError(
                        "Failed to fetch dynamically imported module: x.js",
                    )
                }
                reset={reset}
            />,
        )

        expect(
            screen.getByRole("heading", { name: "A new version is out" }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole("button", { name: "Error details" }),
        ).not.toBeInTheDocument()
    })
})
