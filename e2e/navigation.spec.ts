import { expect, test } from "./fixtures"

test.describe("routing", () => {
    test("the root opens the default board", async ({ page }) => {
        await page.goto("/")

        await expect(page).toHaveURL(/\/planner\/gladiator\/nezekan$/)
        await expect(page).toHaveTitle("Daevanion - Gladiator")
    })

    test("the root goes back to the last board", async ({ page }) => {
        await page.goto("/planner/cleric/zikel")
        await expect(
            page.getByRole("img", { name: "Start node" }),
        ).toBeVisible()

        await page.goto("/")

        await expect(page).toHaveURL(/\/planner\/cleric\/zikel$/)
    })

    test("old links keep the class and board they name", async ({ page }) => {
        await page.goto("/cleric/zikel")

        await expect(page).toHaveURL(/\/planner\/cleric\/zikel$/)
    })

    test("unknown paths fall back to a board", async ({ page }) => {
        await page.goto("/no/such/page")

        await expect(page).toHaveURL(/\/planner\/gladiator\/nezekan$/)
    })
})

test.describe("site navigation", () => {
    test("the header reaches every page", async ({ page }) => {
        await page.goto("/")

        const nav = page.getByRole("navigation", { name: "Site" })

        await nav.getByRole("link", { name: "Timers" }).click()
        await expect(page).toHaveURL(/\/timers/)
        await expect(
            page.getByRole("heading", { name: "Timers" }),
        ).toBeVisible()

        await nav.getByRole("link", { name: "Pets" }).click()
        await expect(page).toHaveURL(/\/pets/)
        await expect(page.getByRole("heading", { name: "Pets" })).toBeVisible()

        await nav.getByRole("link", { name: "Planner" }).click()
        await expect(page).toHaveURL(/\/planner\//)
    })

    test("phones get a menu instead", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto("/timers")

        await page.getByRole("button", { name: "Open menu" }).click()
        await page
            .getByRole("dialog")
            .getByRole("link", { name: "Pets" })
            .click()

        await expect(page).toHaveURL(/\/pets/)
        await expect(page.getByRole("heading", { name: "Pets" })).toBeVisible()
    })

    for (const path of ["/planner/gladiator/nezekan", "/timers", "/pets"]) {
        test(`${path} fits a phone without sideways scrolling`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: 390, height: 844 })
            await page.goto(path)
            await expect(page.getByRole("main")).toBeVisible()

            const overflow = await page.evaluate(() => {
                const root = document.documentElement

                return root.scrollWidth - root.clientWidth
            })

            expect(overflow).toBeLessThanOrEqual(0)
        })
    }
})

test.describe("class select", () => {
    test("switches class and keeps the board", async ({ page }) => {
        await page.goto("/planner/gladiator/zikel")

        await page.getByRole("combobox", { name: "Class" }).click()
        await page.getByRole("option", { name: "Cleric" }).click()

        await expect(page).toHaveURL(/\/planner\/cleric\/zikel$/)
        await expect(page).toHaveTitle("Daevanion - Cleric")
    })
})

test.describe("link previews", () => {
    for (const [path, title] of [
        ["/timers.html", "Daevanion - Timers"],
        ["/pets.html", "Daevanion - Pets"],
        ["/planner/cleric/zikel.html", "Daevanion - Cleric · Zikel"],
    ]) {
        test(`${path} has its own Open Graph tags`, async ({ request }) => {
            const html = await (await request.get(path)).text()

            expect(html).toContain(`<title>${title}</title>`)
            expect(html).toContain(`property="og:title" content="${title}"`)
            expect(html).toContain('property="og:image"')
        })
    }
})
