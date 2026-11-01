import { expect, test } from "./fixtures"

test.describe("logging in", () => {
    test("the footer explains login and offers Discord", async ({ page }) => {
        await page.goto("/timers")
        await page
            .getByRole("contentinfo")
            .getByRole("button", { name: "Log in" })
            .click()

        await expect(page.getByText(/^Log in to keep your plans/)).toBeVisible()
        await expect(
            page.getByRole("button", { name: "Log in with Discord" }).first(),
        ).toBeVisible()
    })

    test("a refused login says why and cleans the URL", async ({ page }) => {
        await page.goto(
            "/timers?tab=event#error=access_denied&error_description=Not+on+the+list",
        )

        // The footer's menu opens by itself; the closed Sharing popover has it too.
        await expect(
            page.getByText("Not on the list").filter({ visible: true }),
        ).toBeVisible()
        await expect(page).toHaveURL(/\/timers\?tab=event$/)
    })

    test("phones log in from the menu", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto("/timers")
        await page.getByRole("button", { name: "Open menu" }).click()

        await expect(
            page
                .getByRole("dialog")
                .getByRole("button", { name: "Log in with Discord" }),
        ).toBeVisible()
    })
})
