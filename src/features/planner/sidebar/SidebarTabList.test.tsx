import { Tabs } from "@chakra-ui/react"
import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { SidebarTabList } from "./SidebarTabList"

const renderTabs = (allBoardsLocked: boolean) => {
    renderWithChakra(
        <Tabs.Root value="plan">
            <SidebarTabList
                savedCount={0}
                hasUnseenResults={true}
                allBoardsLocked={allBoardsLocked}
            />
        </Tabs.Root>,
    )

    return screen.getByRole("tab", { name: /All boards/ })
}

describe("SidebarTabList", () => {
    it("locks All boards on a board it doesn't plan, without the new-results glow", () => {
        const tab = renderTabs(true)

        expect(tab).toBeDisabled()
        expect(tab.getAttribute("title")).toBe(
            "This board isn't planned from All boards",
        )
        expect(tab.getAttribute("aria-description")).toBeNull()
    })

    it("leaves All boards open elsewhere", () => {
        const tab = renderTabs(false)

        expect(tab).toBeEnabled()
        expect(tab.getAttribute("aria-description")).toBe(
            "New optimization results",
        )
    })
})
