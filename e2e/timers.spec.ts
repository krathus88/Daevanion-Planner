import { expect, test } from "./fixtures"

const LAGTA = "High Commander Lagta"

test.describe("tabs", () => {
    test("open from their tab and from the URL", async ({ page }) => {
        await page.goto("/timers")

        await page.getByRole("tab", { name: "Events" }).click()
        await expect(page).toHaveURL(/tab=event/)
        await expect(
            page.getByRole("tabpanel", { name: "Events" }),
        ).toBeVisible()

        await page.goto("/timers?tab=reset")
        await expect(
            page.getByRole("tabpanel", { name: "Resets" }),
        ).toBeVisible()
    })

    test("bad search values fall back", async ({ page }) => {
        await page.goto("/timers?tab=nonsense&region=nowhere")

        await expect(
            page.getByRole("tabpanel", { name: "Field bosses" }),
        ).toBeVisible()
    })

    test("regions switch the bosses shown", async ({ page }) => {
        await page.goto("/timers")
        await expect(page.getByText(LAGTA)).toBeVisible()

        await page
            .getByRole("radiogroup", { name: "Region" })
            .locator("label")
            .filter({ hasText: "Lower Reshanta" })
            .click()

        await expect(page).toHaveURL(/region=abyss/)
        await expect(page.getByText(LAGTA)).toBeHidden()
    })
})

test.describe("countdowns", () => {
    test("count to the next reset at 07:00 UTC", async ({ page }) => {
        await page.clock.setFixedTime(new Date("2026-07-01T06:00:00Z"))
        await page.goto("/timers?tab=reset")

        await expect(
            page
                .getByRole("banner")
                .getByText("Daily", { exact: true })
                .locator(".."),
        ).toContainText("1h 00m")
    })

    test("tick as time passes", async ({ page }) => {
        await page.clock.install({ time: new Date("2026-07-01T06:00:00Z") })
        await page.goto("/timers?tab=reset")

        const daily = page
            .getByRole("banner")
            .getByText("Daily", { exact: true })
            .locator("..")

        // The clock keeps running in real time around the jump.
        await expect(daily).toContainText(/1h 00m|59m \d\ds/)

        // Not runFor: 1,800 ticks of re-rendering can outlast the test's timeout.
        await page.clock.fastForward(30 * 60_000)

        await expect(daily).toContainText(/(30|29)m \d\ds/)
    })
})

test.describe("boss reports", () => {
    test("Killed starts the timer and survives a reload", async ({ page }) => {
        await page.goto("/timers")

        const card = page
            .getByText(LAGTA)
            .locator(
                "xpath=ancestor::*[.//button[normalize-space()='Killed']][1]",
            )

        await expect(card).toContainText("Not set")
        await card.getByRole("button", { name: "Killed" }).click()
        await expect(card).not.toContainText("Not set")

        await page.reload()

        await expect(card).not.toContainText("Not set")
    })
})

test.describe("pinning", () => {
    test("adds a timer to the header and removes it again", async ({
        page,
    }) => {
        await page.goto("/timers")

        const header = page.getByRole("banner")

        await page
            .getByRole("button", { name: `Pin ${LAGTA} to the header` })
            .click()
        await expect(header.getByText(/Lagta/)).toBeVisible()

        await page.reload()
        await expect(header.getByText(/Lagta/)).toBeVisible()

        await page.getByRole("button", { name: `Unpin ${LAGTA}` }).click()
        await expect(header.getByText(/Lagta/)).toBeHidden()
    })

    test("the header's pinned timers can be hidden", async ({ page }) => {
        await page.goto("/timers")

        const header = page.getByRole("banner")

        await expect(header.getByText("Weekly", { exact: true })).toBeVisible()

        await page.getByRole("button", { name: "Hide pinned timers" }).click()

        await expect(header.getByText("Weekly", { exact: true })).toBeHidden()
    })

    test("a header boss with no timer links to its card", async ({ page }) => {
        await page.goto("/pets")
        await page
            .getByRole("link", { name: "Set the Eternal Gartua timer" })
            .click()

        // The page drops `timer` from the URL once it has opened the row, so
        // check the row it opened rather than the passing URL.
        await expect(page).toHaveURL(/\/timers\?/)
        await expect(
            page.getByRole("button", {
                name: "Close Eternal Gartua's options",
            }),
        ).toHaveAttribute("aria-expanded", "true")
        await expect(page).not.toHaveURL(/timer=/)
    })
})

test.describe("corrupt saved data", () => {
    test("doesn't take the page down", async ({ page }) => {
        await page.goto("/timers")
        // Firefox aborts a reload while the app is still starting.
        await expect(
            page.getByRole("heading", { name: "Timers" }),
        ).toBeVisible()
        await page.evaluate(() => {
            localStorage.setItem("daevanion:timers:v1:settings", "{ not json")
        })

        await page.reload()

        await expect(
            page.getByRole("heading", { name: "Timers" }),
        ).toBeVisible()
    })
})
