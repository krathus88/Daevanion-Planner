import { deflateRawSync } from "node:zlib"
import type { Page } from "@playwright/test"
import { expect, test } from "./fixtures"

const BOARD = "/planner/gladiator/nezekan"

// Touches the start node on Nezekan, a 1-point stat, and the one reached only
// through it.
const NEAR_START = /^Row 5, column 6, /
const BEHIND_NEAR_START = /^Row 5, column 7, /
// A skill worth 3 points, a few nodes out.
const SKILL = /^Row 1, column 7, Skill, /

const cell = (page: Page, name: RegExp) => {
    return page.getByRole("main").getByRole("button", { name: name })
}

const useManualMode = async (page: Page) => {
    await page.getByText("Manual", { exact: true }).click()
    await expect(page.getByRole("radio", { name: "Manual" })).toBeChecked()
}

// A share link as the site writes them: deflated JSON in URL-safe base64.
const shareCode = (payload: unknown) => {
    return deflateRawSync(JSON.stringify(payload)).toString("base64url")
}

test.describe("the board", () => {
    test("shows its nodes and sidebar", async ({ page }) => {
        await page.goto(BOARD)

        await expect(
            page.getByRole("img", { name: "Start node" }),
        ).toBeVisible()
        await expect(cell(page, SKILL)).toBeVisible()
        await expect(
            page.getByRole("tab", { name: "This board" }),
        ).toHaveAttribute("aria-selected", "true")
    })

    for (const board of ["zikel", "vaizel", "triniel", "ariel"]) {
        test(`opens ${board}`, async ({ page }) => {
            await page.goto(BOARD)
            await page
                .getByRole("navigation", { name: "Select board" })
                .getByRole("link", { name: new RegExp(board, "i") })
                .click()

            await expect(page).toHaveURL(new RegExp(`/${board}$`))
            await expect(
                page.getByRole("img", { name: "Start node" }),
            ).toBeVisible()
        })
    }

    test("shows a skill's tooltip on hover", async ({ page }) => {
        await page.goto(BOARD)
        await cell(page, SKILL).hover()

        await expect(page.getByRole("tooltip")).toContainText("Aerial Snare")
    })
})

test.describe("manual mode", () => {
    test("selecting a node takes the path to it too", async ({ page }) => {
        await page.goto(BOARD)
        await useManualMode(page)

        await cell(page, BEHIND_NEAR_START).click()

        await expect(cell(page, BEHIND_NEAR_START)).toHaveAccessibleName(
            /, selected/,
        )
        await expect(cell(page, NEAR_START)).toHaveAccessibleName(/, selected/)
    })

    test("deselecting drops what it cut off", async ({ page }) => {
        await page.goto(BOARD)
        await useManualMode(page)

        await cell(page, BEHIND_NEAR_START).click()
        await expect(cell(page, NEAR_START)).toHaveAccessibleName(/, selected/)

        await cell(page, NEAR_START).click()

        await expect(cell(page, BEHIND_NEAR_START)).toHaveAccessibleName(
            /not selected/,
        )
    })

    test("the selection survives a reload", async ({ page }) => {
        await page.goto(BOARD)
        await useManualMode(page)
        await cell(page, NEAR_START).click()
        await expect(cell(page, NEAR_START)).toHaveAccessibleName(/, selected/)

        await page.reload()
        await useManualMode(page)

        await expect(cell(page, NEAR_START)).toHaveAccessibleName(/, selected/)
    })

    test("each class and board keeps its own selection", async ({ page }) => {
        await page.goto(BOARD)
        await useManualMode(page)
        await cell(page, NEAR_START).click()
        await expect(cell(page, NEAR_START)).toHaveAccessibleName(/, selected/)

        await page.goto("/planner/cleric/nezekan")
        await useManualMode(page)

        await expect(cell(page, NEAR_START)).toHaveAccessibleName(
            /not selected/,
        )
    })
})

test.describe("planner mode", () => {
    test("finds a route to a chosen node in the worker", async ({ page }) => {
        test.setTimeout(60_000)

        await page.goto(BOARD)
        await cell(page, SKILL).click()
        await page
            .getByRole("combobox", { name: "Stop after no improvement for" })
            .selectOption({ label: "30s" })
        await page.getByRole("button", { name: "Find a good path" }).click()

        await expect(
            page.getByText(/First route ready at|Best route so far found at/),
        ).toBeVisible({ timeout: 15_000 })

        const routeCost = page
            .getByText("Route cost", { exact: true })
            .locator("..")

        await expect(routeCost).toContainText(/\d+/, { timeout: 30_000 })
        await expect(cell(page, SKILL)).toHaveAccessibleName(
            /, selected|route/i,
        )
    })
})

test.describe("all boards", () => {
    test("optimizes every board within the budget", async ({ page }) => {
        test.setTimeout(90_000)

        await page.goto(BOARD)
        await page.getByRole("tab", { name: "All boards" }).click()

        const panel = page.getByRole("tabpanel", { name: "All boards" })

        await panel
            .getByRole("combobox", { name: "Stop after no improvement for" })
            .selectOption({ label: "30s" })
        await panel.getByRole("button", { name: "Optimize all boards" }).click()

        await expect(
            panel.getByText(/First plan ready at|Best plan so far found at/),
        ).toBeVisible({ timeout: 15_000 })
        await panel.getByRole("button", { name: "Stop & keep" }).click()
        await expect(
            panel.getByRole("button", { name: "Optimize all boards" }),
        ).toBeEnabled({ timeout: 60_000 })

        const stored = await page.evaluate(() => {
            const costs: number[] = []

            for (const board of ["nezekan", "zikel", "vaizel", "triniel"]) {
                const raw = localStorage.getItem(
                    `daevanion:v1:gladiator:${board}:progress`,
                )

                costs.push(raw ? (JSON.parse(raw).plannedCost ?? 0) : 0)
            }

            return costs
        })
        const total = stored.reduce((sum, cost) => sum + cost, 0)

        expect(total).toBeGreaterThan(0)
        expect(total).toBeLessThanOrEqual(225)
    })

    test("the point budget carries to This board", async ({ page }) => {
        await page.goto(BOARD)
        await page.getByRole("tab", { name: "All boards" }).click()
        await page.getByRole("textbox", { name: "Total points" }).fill("100")

        await page.getByRole("tab", { name: "This board" }).click()

        await expect(
            page.getByRole("textbox", { name: "Total points (all boards)" }),
        ).toHaveValue("100")
        await expect(page.getByText("Available here · 100")).toBeVisible()
    })
})

test.describe("sharing", () => {
    const payload = {
        v: 1,
        c: "gladiator",
        // Cell 0 is row 1, column 1.
        b: { nezekan: { m: [[0, 1], 50] } },
    }

    test("opens a shared plan", async ({ page }) => {
        await page.goto(`${BOARD}?share=${shareCode(payload)}`)

        await expect(
            page.getByRole("img", { name: "Start node" }),
        ).toBeVisible()
        await expect(page.getByRole("main")).not.toContainText("broken")
        await expect(page.getByRole("main")).not.toContainText(
            "Opening shared plan",
        )
    })

    test("explains a broken link", async ({ page }) => {
        await page.goto(`${BOARD}?share=not-a-real-code`)

        await expect(page.getByRole("main")).toContainText(
            "This share link is broken or incomplete",
        )
    })

    test("refuses another class's link", async ({ page }) => {
        await page.goto(`/planner/cleric/nezekan?share=${shareCode(payload)}`)

        await expect(page.getByRole("main")).toContainText(
            "This share link is broken or incomplete",
        )
    })

    test("asks for a reload on a link from a newer site", async ({ page }) => {
        await page.goto(`${BOARD}?share=${shareCode({ ...payload, v: 999 })}`)

        await expect(page.getByRole("main")).toContainText("newer version")
    })
})

test.describe("corrupt saved data", () => {
    test("doesn't take the page down", async ({ page }) => {
        await page.goto(BOARD)
        await page.evaluate(() => {
            localStorage.setItem(
                "daevanion:v1:gladiator:nezekan:progress",
                "{ not json",
            )
            localStorage.setItem("daevanion:v1:gladiator:settings", "[1,2,3]")
            localStorage.setItem("daevanion:planner-location", "nonsense")
        })

        await page.reload()

        await expect(
            page.getByRole("img", { name: "Start node" }),
        ).toBeVisible()
    })
})
