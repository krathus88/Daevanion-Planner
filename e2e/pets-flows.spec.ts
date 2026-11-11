import type { Page } from "@playwright/test"
import { expect, test } from "./fixtures"

const KEY = "daevanion:pets:v1:collection"
const PET = "Aberrant Tog"

const openPet = async (page: Page) => {
    await page.goto("/pets")
    await page
        .getByRole("button", { name: new RegExp(PET) })
        .first()
        .click()
    await expect(page).toHaveURL(/pet=/)
}

const readCollection = (page: Page) => {
    return page.evaluate((key) => {
        return JSON.parse(localStorage.getItem(key) ?? "null")
    }, KEY)
}

const shownCount = async (page: Page) => {
    const text = await page.getByText(/^\d+ shown$/).textContent()

    return Number(text?.split(" ")[0])
}

const blankPng = (page: Page) => {
    return page.evaluate(() => {
        const canvas = document.createElement("canvas")

        canvas.width = 400
        canvas.height = 300

        return canvas.toDataURL("image/png").split(",")[1]
    })
}

test.describe("levels", () => {
    test("setting a level and souls saves them", async ({ page }) => {
        await openPet(page)

        const levels = page.getByLabel("Your Insight level")

        await levels.getByText("Lv2", { exact: true }).click()

        await expect
            .poll(async () => {
                return Object.values((await readCollection(page)).levels)
            })
            .toEqual([2])

        // Saved on Enter or leaving the field, not while typing.
        await page.getByLabel("Souls towards the next level").fill("40")
        await page.keyboard.press("Enter")

        await expect
            .poll(async () => {
                return Object.values((await readCollection(page)).souls)
            })
            .toEqual([70])
    })

    test("hiding a level takes its pets off the list", async ({ page }) => {
        await openPet(page)
        await page
            .getByLabel("Your Insight level")
            .getByText("Lv3", { exact: true })
            .click()
        await page.getByRole("button", { name: "Close pet" }).click()

        const all = await shownCount(page)

        await page.getByRole("button", { name: "List options" }).click()
        await page
            .getByRole("group", { name: "Hide pets at these Insight levels" })
            .getByRole("button", { name: "Lv3" })
            .click()

        // The list and map re-render on a deferred value: ~0.25s in Chromium,
        // ~1.7s in Firefox, past 5s while other tests share the machine.
        await expect(page.getByText(`${all - 1} shown`)).toBeVisible({
            timeout: 20_000,
        })
    })
})

test.describe("Best spots", () => {
    test("clicking a spot focuses it and shows its pets", async ({ page }) => {
        await page.goto("/pets")
        await page.getByRole("button", { name: /^#1 / }).click()

        await expect(page).toHaveURL(/spot=/)
    })

    test("shows more spots on request", async ({ page }) => {
        await page.goto("/pets")
        await expect(page.getByRole("button", { name: /^#4 / })).toBeVisible()
        await expect(page.getByRole("button", { name: /^#5 / })).toBeHidden()

        await page.getByRole("button", { name: /^Show \d+ more/ }).click()

        await expect(page.getByRole("button", { name: /^#5 / })).toBeVisible()
    })

    test("a spot's pet chip opens that pet", async ({ page }) => {
        await page.goto("/pets")
        await page
            .getByRole("button", { name: "Crestlich", exact: false })
            .first()
            .click()

        await expect(page).toHaveURL(/pet=/)
    })

    test("must-include types narrow the spots", async ({ page }) => {
        await page.goto("/pets")

        const group = page.getByRole("group", {
            name: "Spots must include these pet types",
        })

        await group.getByRole("button").first().click()

        await expect(page.getByRole("button", { name: /^#1 / })).toBeVisible()
    })
})

test.describe("an open pet's spots", () => {
    test("a spot focuses the map, and Also here adds neighbors", async ({
        page,
    }) => {
        await openPet(page)
        await page.getByRole("button", { name: /^All-Curing Cave 2 / }).click()
        await expect(page).toHaveURL(/spot=/)

        await page.getByRole("button", { name: "Also here" }).first().click()

        await expect(page).toHaveURL(/others=/)
    })

    test("switching map changes the URL", async ({ page }) => {
        await openPet(page)
        await page
            .getByRole("radiogroup", { name: "Map" })
            .locator("label")
            .filter({ hasText: "Altgard" })
            .click()

        await expect(page).toHaveURL(/map=altgard/)
    })

    test("closes back to Best spots", async ({ page }) => {
        await openPet(page)
        await page.getByRole("button", { name: "Close pet" }).click()

        await expect(page).not.toHaveURL(/pet=/)
        await expect(page.getByRole("button", { name: /^#1 / })).toBeVisible()
    })

    // Cadaver Cleaner only spawns in Altgard, so it opens there with no map
    // in the URL.
    test("closing a pet stays on its map", async ({ page }) => {
        await page.goto("/pets")
        await page
            .getByRole("button", { name: /Cadaver Cleaner/ })
            .first()
            .click()
        await expect(page).toHaveURL(/pet=/)
        await expect(page).not.toHaveURL(/map=/)
        await page.getByRole("button", { name: "Close pet" }).click()

        await expect(page).not.toHaveURL(/pet=/)
        await expect(page).toHaveURL(/map=altgard/)
    })
})

test.describe("the map's pins", () => {
    // Sweeps the map until the pointer lands on a pin.
    const findPin = async (page: Page) => {
        const map = page.locator(".leaflet-container")

        await map.scrollIntoViewIfNeeded()

        const box = await map.boundingBox()
        const viewport = page.viewportSize()

        if (!box || !viewport) {
            throw new Error("No map on the page.")
        }

        const tooltip = page.locator(".pet-tooltip")
        const bottom = Math.min(box.y + box.height, viewport.height) - 20
        const right = Math.min(box.x + box.width, viewport.width) - 20

        for (let y = Math.max(box.y, 0) + 20; y < bottom; y += 8) {
            for (let x = box.x + 20; x < right; x += 8) {
                await page.mouse.move(x, y)

                if (await tooltip.isVisible()) {
                    return { x: x, y: y }
                }
            }
        }

        throw new Error("No pin found on the map.")
    }

    test("hovering shows a pin's tooltip, clicking opens its pet", async ({
        page,
    }) => {
        test.setTimeout(90_000)

        await page.goto("/pets")
        await page.getByRole("button", { name: /^#1 / }).click()
        await expect(page).toHaveURL(/spot=/)
        await page.waitForTimeout(800)

        const point = await findPin(page)

        await expect(page.locator(".pet-tooltip")).toContainText(/Lv\d+/)

        await page.mouse.click(point.x, point.y)

        await expect(page).toHaveURL(/pet=/)
    })

    test("zoom buttons work", async ({ page }) => {
        await page.goto("/pets")
        await expect(page.locator(".leaflet-container")).toBeVisible()

        await page.getByRole("button", { name: "Zoom in" }).click()
        await page.getByRole("button", { name: "Zoom out" }).click()

        await expect(page.locator(".leaflet-container canvas")).toHaveCount(1)
    })
})

test.describe("screenshot dialogs", () => {
    for (const [button, name] of [
        ["Import levels from screenshots", "importer"],
        ["Check the pet shop", "shop check"],
    ]) {
        test(`the ${name} copes with a screenshot of nothing`, async ({
            page,
        }) => {
            await page.goto("/pets")
            await page.getByRole("button", { name: button }).click()

            const dialog = page.getByRole("dialog")
            const png = await blankPng(page)

            await dialog.locator('input[type="file"]').setInputFiles({
                name: "nothing.png",
                mimeType: "image/png",
                buffer: Buffer.from(png, "base64"),
            })

            await expect(dialog).not.toContainText("Reading screenshot", {
                timeout: 20_000,
            })
            await expect(dialog).toBeVisible()
        })
    }
})
