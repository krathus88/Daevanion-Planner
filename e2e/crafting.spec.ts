import { expect, test } from "./fixtures"

const KEY = "daevanion:crafting:v1:settings"

// Orichalcum Ingot: 20 Orichalcum Ore and 10 Orichalcum Solvent (Bound) per
// craft of 10, from the generated recipe data.
const INGOT_URL = "/crafting?item=610710001"

test.describe("crafting", () => {
    test("finds a recipe and plans its materials", async ({ page }) => {
        await page.goto("/crafting")
        await expect(page).toHaveTitle("Daevanion - Crafting")
        await expect(page.getByText("Pick a recipe")).toBeVisible()

        await page.getByLabel("Search recipes").fill("orichalcum ingot")
        await page.getByRole("button", { name: /Orichalcum Ingot/ }).click()

        await expect(page).toHaveURL(/item=610710001/)
        await expect(page.getByText(/^1 to make · 1 craft of 10/)).toBeVisible()

        await page.getByLabel("How many").fill("25")
        await expect(page).toHaveURL(/count=25/)
        await expect(
            page.getByText(/^25 to make · 3 crafts of 10/),
        ).toBeVisible()

        const ore = page.getByRole("group", { name: "Orichalcum Ore" })

        await expect(ore.getByText("20×")).toBeVisible()
        await expect(ore.getByText("60", { exact: true })).toBeVisible()
    })

    test("keeps bag counts and prices after a reload", async ({ page }) => {
        await page.goto(INGOT_URL)
        await page.getByRole("button", { name: /^All materials/ }).click()

        // The tree line has a price field too; the bag count is in the table.
        const ore = page
            .getByRole("group", { name: "Orichalcum Ore" })
            .filter({ has: page.getByLabel("In the bag") })

        await ore.getByLabel("In the bag").fill("15")
        await ore.getByLabel("Price (Kinah)").fill("1000")
        await ore.getByLabel("Price (Kinah)").blur()
        await expect(ore.getByText("15", { exact: true })).toBeVisible()
        await expect(ore.getByText("5,000")).toBeVisible()

        await page.reload()
        await page.getByRole("button", { name: /^All materials/ }).click()

        await expect(ore.getByText("15", { exact: true })).toBeVisible()

        const saved = await page.evaluate((key) => {
            return localStorage.getItem(key)
        }, KEY)

        expect(JSON.parse(saved ?? "{}")).toMatchObject({
            server: "siel",
            owned: { 610620013: 15 },
            prices: { siel: { 610620013: { value: 1000 } } },
        })
    })

    test("shows the recipes of the server's faction, by tab", async ({
        page,
    }) => {
        await page.goto("/crafting")
        await page.getByLabel("Profession").selectOption("cooking")
        await page.getByLabel("Tab").selectOption("food")

        // Siel is Elyos: 15 foods, the game's order.
        await expect(page.getByText("15 shown")).toBeVisible()
        await expect(
            page.getByRole("button", { name: /^Steamed Cypri/ }),
        ).toBeVisible()

        await page.getByLabel("Server").selectOption("israphel")

        await expect(
            page.getByRole("button", { name: /^Steamed Pujery/ }),
        ).toBeVisible()
        await expect(
            page.getByRole("button", { name: /^Steamed Cypri/ }),
        ).toBeHidden()
    })

    test("counts the attempts a combo item takes", async ({ page }) => {
        // Artisan's Splendent Orichalcum Greatsword procs 25% of the time.
        await page.goto("/crafting?item=110130013")

        await expect(
            page.getByText(/^1 to make · 1 craft · about 4 attempts/),
        ).toBeVisible()
        await expect(
            page.getByText(/^Not crafted directly/).first(),
        ).toBeVisible()

        // Every attempt uses an Expert's piece: 4 of them, about 16 attempts.
        await page
            .getByRole("group", {
                name: "Expert's Splendent Orichalcum Greatsword",
            })
            .getByRole("button")
            .first()
            .click()
        await expect(
            page.getByText(/^4 needed · 4 crafts · about 16 attempts/),
        ).toBeVisible()
    })

    test("shows the open recipe in the list after a reload", async ({
        page,
    }) => {
        // White Dragon Lord Ring: Transfer Crafting, far down its list.
        await page.goto("/crafting?item=310330112")

        await expect(
            page.getByRole("radio", { name: "Transfer Crafting" }),
        ).toBeChecked()
        await expect(
            page.getByRole("button", { name: /^White Dragon Lord Ring/ }),
        ).toBeInViewport()
    })

    test("opens the item a craft is made from", async ({ page }) => {
        // Splendent True Dragon Lord Ring is transferred from True Dragon
        // Lord Ring, a Crafting window recipe.
        await page.goto("/crafting?item=310330113")
        await page
            .getByRole("button", { name: "True Dragon Lord Ring", exact: true })
            .first()
            .click()

        await expect(page).toHaveURL(/item=310330015/)
        await expect(
            page.getByRole("radio", { name: "Crafting", exact: true }),
        ).toBeChecked()
        await expect(
            page.getByRole("button", {
                name: /^True Dragon Lord Ring/,
                pressed: true,
            }),
        ).toBeInViewport()
    })
})
