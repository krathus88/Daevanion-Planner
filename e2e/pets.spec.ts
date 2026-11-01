import { expect, test } from "./fixtures"

const FIELD_PET = "Aberrant Armadon"
const STORAGE_KEY = "daevanion:pets:v1:collection"

test.describe("the pet list", () => {
    test("lists pets with their spawns", async ({ page }) => {
        await page.goto("/pets")

        await expect(page.getByText(/^\d+ shown$/)).toBeVisible()
        await expect(
            page.getByRole("button", { name: FIELD_PET, exact: false }).first(),
        ).toContainText("Verteron")
    })

    test("searches by pet name", async ({ page }) => {
        await page.goto("/pets")
        await page
            .getByRole("searchbox", { name: "Search pets" })
            .fill(FIELD_PET.toLowerCase())

        await expect(page.getByText("1 shown")).toBeVisible()
    })

    test("shows nothing for a search with no match", async ({ page }) => {
        await page.goto("/pets")
        await page
            .getByRole("searchbox", { name: "Search pets" })
            .fill("zzzzzzzz")

        await expect(page.getByText("0 shown")).toBeVisible()
    })

    test("filters by type", async ({ page }) => {
        await page.goto("/pets")

        const shown = page.getByText(/^\d+ shown$/)
        const before = await shown.textContent()

        await page.getByText("Special", { exact: true }).first().click()

        await expect(shown).not.toHaveText(before ?? "")
    })

    test("folds away and comes back", async ({ page }) => {
        await page.goto("/pets")
        await page.getByRole("button", { name: "Minimize list" }).click()

        await expect(
            page.getByRole("searchbox", { name: "Search pets" }),
        ).toBeHidden()

        await page.reload()

        await expect(
            page.getByRole("searchbox", { name: "Search pets" }),
        ).toBeHidden()
    })
})

test.describe("a pet's details", () => {
    test("opens from the list, in the URL", async ({ page }) => {
        await page.goto("/pets")
        await page.getByRole("button", { name: FIELD_PET }).first().click()

        await expect(page).toHaveURL(/pet=/)
        await expect(page.getByRole("main")).toContainText(FIELD_PET)
    })

    test("opens from a shared URL", async ({ page }) => {
        await page.goto("/pets")
        await page.getByRole("button", { name: FIELD_PET }).first().click()
        await expect(page).toHaveURL(/pet=/)

        const url = page.url()

        await page.goto("about:blank")
        await page.goto(url)

        await expect(page.getByRole("main")).toContainText(FIELD_PET)
    })

    test("survives an unknown pet id in the URL", async ({ page }) => {
        await page.goto("/pets?pet=999999999")

        await expect(page.getByText(/^\d+ shown$/)).toBeVisible()
    })
})

test.describe("the map", () => {
    test("draws its pins on a canvas", async ({ page }) => {
        await page.goto("/pets")

        await expect(page.locator(".leaflet-container")).toBeVisible()
        await expect(page.locator(".leaflet-container canvas")).toHaveCount(1)
    })

    test("the map search value picks the map", async ({ page }) => {
        await page.goto("/pets?map=altgard")

        await expect(page.locator(".leaflet-container")).toBeVisible()
        await expect(page).toHaveURL(/map=altgard/)
    })
})

test.describe("your collection", () => {
    test("the levels tip stays dismissed", async ({ page }) => {
        await page.goto("/pets")
        await page.getByRole("button", { name: "Got it" }).click()
        await expect(page.getByRole("button", { name: "Got it" })).toBeHidden()

        await page.reload()

        await expect(page.getByText(/^\d+ shown$/)).toBeVisible()
        await expect(page.getByRole("button", { name: "Got it" })).toBeHidden()
    })

    test("saved levels hide pets through the list options", async ({
        page,
    }) => {
        await page.goto("/pets")
        await expect(page.getByText(/^\d+ shown$/)).toBeVisible()

        const petId = await page.evaluate(async () => {
            const entries = performance.getEntriesByType("resource")
            const atlas = entries.find((entry) => {
                return entry.name.includes("petAtlas")
            })
            const data = await fetch(atlas?.name ?? "").then((response) => {
                return response.json()
            })

            return data.pets[0].id as number
        })

        await page.evaluate(
            ([key, id]) => {
                localStorage.setItem(
                    key as string,
                    JSON.stringify({
                        levels: { [id]: 3 },
                        hiddenLevels: [3],
                    }),
                )
            },
            [STORAGE_KEY, petId] as const,
        )
        await page.reload()

        const shown = page.getByText(/^\d+ shown$/)

        await expect(shown).toBeVisible()

        const count = Number((await shown.textContent())?.split(" ")[0])

        await page.evaluate((key) => {
            localStorage.removeItem(key)
        }, STORAGE_KEY)
        await page.reload()

        await expect(shown).toBeVisible()

        const all = Number((await shown.textContent())?.split(" ")[0])

        expect(count).toBe(all - 1)
    })

    test("old saves still load", async ({ page }) => {
        await page.goto("/pets")
        await page.evaluate((key) => {
            localStorage.setItem(
                key,
                JSON.stringify({ souls: { 1: 40 }, hideUnlocked: true }),
            )
        }, STORAGE_KEY)

        await page.reload()

        await expect(page.getByText(/^\d+ shown$/)).toBeVisible()
    })
})

test.describe("screenshot dialogs", () => {
    test("the importer opens and closes", async ({ page }) => {
        await page.goto("/pets")
        await page
            .getByRole("button", { name: "Import levels from screenshots" })
            .click()

        const dialog = page.getByRole("dialog")

        await expect(dialog).toContainText("Drop screenshots here")

        await page.keyboard.press("Escape")

        await expect(dialog).toBeHidden()
    })

    test("the shop check opens", async ({ page }) => {
        await page.goto("/pets")
        await page.getByRole("button", { name: "Check the pet shop" }).click()

        await expect(page.getByRole("dialog")).toContainText(
            "Drop screenshots here",
        )
    })
})

test.describe("corrupt saved data", () => {
    test("doesn't take the page down", async ({ page }) => {
        await page.goto("/pets")
        await page.evaluate((key) => {
            localStorage.setItem(key, "{ not json")
        }, STORAGE_KEY)

        await page.reload()

        await expect(page.getByRole("heading", { name: "Pets" })).toBeVisible()
    })
})
