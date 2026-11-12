import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { COMPANION_DOWNLOAD, CompanionNote } from "./CompanionNote"

describe("CompanionNote", () => {
    it("says the companion is connected and who is played", () => {
        renderWithChakra(
            <CompanionNote
                status={{
                    state: "running",
                    character: { name: "Testchar", server: 1301, class: 30 },
                }}
            />,
        )

        expect(
            screen.getByText("Companion app connected · playing Testchar"),
        ).toBeInTheDocument()
    })

    it("reminds to start it, with where to get it", () => {
        renderWithChakra(<CompanionNote status={{ state: "stopped" }} />)

        expect(screen.getByRole("link", { name: "Get it" })).toHaveAttribute(
            "href",
            COMPANION_DOWNLOAD,
        )
    })

    it("shows nothing while it isn't known", () => {
        renderWithChakra(<CompanionNote status={{ state: "unknown" }} />)

        expect(screen.queryByText(/Companion app/)).not.toBeInTheDocument()
        expect(screen.queryByRole("link")).not.toBeInTheDocument()
    })
})
