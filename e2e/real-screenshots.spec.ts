import { expect, test } from "./fixtures"

// The real game screenshots, uploaded through the real dialogs, so these also
// cover the browser's canvas decoding that the Vitest readers replace.
const shot = (name: string) => {
    return new URL(
        `../src/test/screenshots/${name}`,
        import.meta.url,
    ).pathname.replace(/^\/([A-Za-z]:)/, "$1")
}

test.describe("the shop check", () => {
    test("sorts pets on sale from sold-out ones", async ({ page }) => {
        await page.goto("/pets")
        await page.getByRole("button", { name: "Check the pet shop" }).click()

        const dialog = page.getByRole("dialog")

        await dialog
            .locator('input[type="file"]')
            .setInputFiles(shot("shop.jpg"))

        await expect(dialog.getByText("Worth buying (2)")).toBeVisible({
            timeout: 30_000,
        })
        await expect(dialog.getByText("Intermediate Wind Spirit")).toBeVisible()
        await expect(dialog.getByText("Intermediate Fire Spirit")).toBeVisible()
        await expect(dialog.getByText("Already bought (1)")).toBeVisible()
        await expect(dialog.getByText("Dratona Tinkerer")).toBeVisible()
        await expect(dialog.getByText(/^7 other items were/)).toBeVisible()
    })

    test("a sold-out pet can still have its souls added", async ({ page }) => {
        await page.goto("/pets")
        await page.getByRole("button", { name: "Check the pet shop" }).click()

        const dialog = page.getByRole("dialog")

        await dialog
            .locator('input[type="file"]')
            .setInputFiles(shot("shop.jpg"))
        await expect(dialog.getByText("Already bought (1)")).toBeVisible({
            timeout: 30_000,
        })

        await dialog
            .getByText(/^Bought/)
            .last()
            .click()

        await expect
            .poll(async () => {
                const saved = await page.evaluate(() => {
                    return localStorage.getItem("daevanion:pets:v1:collection")
                })

                return Object.values(JSON.parse(saved ?? "{}").souls ?? {})
            })
            .toEqual([5])
    })

    test("refuses a Pets grid screenshot", async ({ page }) => {
        await page.goto("/pets")
        await page.getByRole("button", { name: "Check the pet shop" }).click()

        const dialog = page.getByRole("dialog")

        await dialog.locator('input[type="file"]').setInputFiles(shot("4.jpg"))

        await expect(dialog.getByRole("alert")).toContainText(
            "Not a Shop screenshot",
            { timeout: 30_000 },
        )
        await expect(dialog.getByRole("alert")).toContainText("4.jpg")
        await expect(dialog.getByText("No pets found on sale.")).toBeHidden()
    })
})

test.describe("the pet importer", () => {
    test("reads a real grid into the review list", async ({ page }) => {
        await page.goto("/pets")
        await page
            .getByRole("button", { name: "Import levels from screenshots" })
            .click()

        const dialog = page.getByRole("dialog")

        await dialog.locator('input[type="file"]').setInputFiles(shot("4.jpg"))

        await expect(dialog.getByText("Swift Lugi")).toBeVisible({
            timeout: 30_000,
        })
        await expect(dialog.getByText("Distorted Mutant")).toBeVisible()
    })

    test("finds every card with a selected one in a short crop", async ({
        page,
    }) => {
        await page.goto("/pets")
        await page
            .getByRole("button", { name: "Import levels from screenshots" })
            .click()

        const dialog = page.getByRole("dialog")

        await dialog.locator('input[type="file"]').setInputFiles(shot("2.jpg"))

        await expect(dialog.getByText("Red Spark Ignus")).toBeVisible({
            timeout: 30_000,
        })
        await expect(dialog.getByText("Krall Laborer")).toBeVisible()
        await expect(dialog.getByText("Varg Berserker")).toBeVisible()
    })

    test("refuses a Shop screenshot", async ({ page }) => {
        await page.goto("/pets")
        await page
            .getByRole("button", { name: "Import levels from screenshots" })
            .click()

        const dialog = page.getByRole("dialog")

        await dialog
            .locator('input[type="file"]')
            .setInputFiles(shot("shop.jpg"))

        await expect(dialog.getByRole("alert")).toContainText(
            "Not a Pets grid screenshot",
            { timeout: 30_000 },
        )
        await expect(dialog.getByRole("alert")).toContainText("shop.jpg")
        await expect(dialog.getByText(/^Read 0 pets/)).toBeHidden()
        await expect(
            dialog.getByRole("button", { name: "Apply 0 changes" }),
        ).toBeDisabled()
    })

    test("still reads the grid when a Shop screenshot comes with it", async ({
        page,
    }) => {
        await page.goto("/pets")
        await page
            .getByRole("button", { name: "Import levels from screenshots" })
            .click()

        const dialog = page.getByRole("dialog")

        await dialog
            .locator('input[type="file"]')
            .setInputFiles([shot("shop.jpg"), shot("4.jpg")])

        await expect(dialog.getByText("Swift Lugi")).toBeVisible({
            timeout: 30_000,
        })
        await expect(dialog.getByRole("alert")).toContainText("shop.jpg")
    })
})

test.describe("the game check", () => {
    test("reads a real board and marks it", async ({ page }) => {
        await page.goto("/planner/gladiator/nezekan")
        await page
            .getByRole("tabpanel", { name: "This board" })
            .getByRole("button", { name: "Check screenshots" })
            .click()

        const dialog = page.getByRole("dialog")

        await dialog
            .locator('input[type="file"]')
            .setInputFiles(shot("daevanion.jpg"))

        // Nothing is planned yet, so all 53 acquired nodes count as extra.
        await expect(dialog).toContainText("53", { timeout: 30_000 })
        await expect(dialog).not.toContainText("daevanion.jpg")
    })
})
