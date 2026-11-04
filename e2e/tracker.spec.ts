import type { Page } from "@playwright/test"
import { expect, test } from "./fixtures"

const KEY = "daevanion:tracker:v1:data"

// Tuesday 3 November 2026, 12:00 UTC: the next daily reset is Wednesday 07:00
// UTC, which is also the weekly one.
const TUESDAY = new Date("2026-11-03T12:00:00Z")

const addCharacter = async (page: Page, name: string) => {
    await page.getByRole("button", { name: "Characters" }).click()

    const dialog = page.getByRole("dialog", { name: "Characters" })

    await dialog.getByLabel("New character name").fill(name)
    await dialog.getByRole("button", { name: "Add" }).click()
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
}

// Adding characters through the dialog is covered once; the rest start with
// them saved. Chakra draws the checkbox over its input, so checks are forced.
const openWithCharacters = async (page: Page, names: string[]) => {
    await page.goto("/tracker")
    await page.evaluate(
        ([key, value]) => {
            localStorage.setItem(key, value)
        },
        [
            KEY,
            JSON.stringify({
                characters: names.map((name) => ({
                    id: name,
                    name: name,
                    classId: "cleric",
                })),
                tasks: null,
                counts: {},
            }),
        ] as const,
    )
    await page.reload()
    await expect(page.getByRole("heading", { name: "Tracker" })).toBeVisible()
}

test.describe("tracker", () => {
    test("adds a card per character", async ({ page }) => {
        await page.goto("/tracker")
        await expect(page).toHaveTitle("Daevanion - Tracker")

        await addCharacter(page, "Aria")
        await addCharacter(page, "Bran")

        const characters = page.getByRole("region", { name: "Characters" })

        await expect(
            characters.getByRole("article", { name: "Aria" }),
        ).toBeVisible()
        await expect(
            characters.getByRole("article", { name: "Bran" }),
        ).toBeVisible()
    })

    test("ticks tasks per character and keeps them", async ({ page }) => {
        await page.clock.setFixedTime(TUESDAY)
        await openWithCharacters(page, ["Aria", "Bran"])

        await page
            .getByRole("checkbox", { name: "Supply Requests, Aria" })
            .check({ force: true })
        await page
            .getByRole("button", { name: "Ascension Trial, Bran: 1 of 3" })
            .click()

        await page.reload()

        await expect(
            page.getByRole("checkbox", { name: "Supply Requests, Aria" }),
        ).toBeChecked()
        await expect(
            page.getByRole("checkbox", { name: "Supply Requests, Bran" }),
        ).not.toBeChecked()
        await expect(
            page.getByRole("button", { name: "Ascension Trial, Bran: 1 of 3" }),
        ).toHaveAttribute("aria-pressed", "true")
    })

    test("clears dailies and weeklies at their resets", async ({ page }) => {
        await page.clock.install({ time: TUESDAY })
        await openWithCharacters(page, ["Aria"])

        const firstTrial = page.getByRole("button", {
            name: "Ascension Trial, Aria: 1 of 3",
        })

        await page
            .getByRole("checkbox", { name: "Supply Requests, Aria" })
            .check({ force: true })
        await firstTrial.click()
        await expect(firstTrial).toHaveAttribute("aria-pressed", "true")

        const useThree = async (label: string) => {
            const use = page.getByRole("button", { name: `Use one: ${label}` })

            await use.click()
            await use.click()
            await use.click()
        }
        const nightmare = page.getByRole("textbox", {
            name: "Entries left: Nightmare, Aria",
        })
        const dungeon = page.getByRole("textbox", {
            name: "Entries left: Daily Dungeon (Unknown Fissure), Siel",
        })

        await useThree("Nightmare, Aria")
        await useThree("Daily Dungeon (Unknown Fissure), Siel")
        await expect(nightmare).toHaveValue("11")
        await expect(dungeon).toHaveValue("11")

        // Past Wednesday's 07:00 UTC reset.
        await page.clock.fastForward(20 * 60 * 60 * 1000)

        await expect(
            page.getByRole("checkbox", { name: "Supply Requests, Aria" }),
        ).not.toBeChecked()
        await expect(firstTrial).toHaveAttribute("aria-pressed", "false")
        // Nightmare gains 2 entries a day; the Daily Dungeon refills weekly.
        await expect(nightmare).toHaveValue("13")
        await expect(dungeon).toHaveValue("14")
    })

    test("keeps a minimized card minimized", async ({ page }) => {
        await openWithCharacters(page, ["Aria"])

        await page.getByRole("button", { name: "Minimize Aria" }).click()
        await page.reload()

        const aria = page.getByRole("article", { name: "Aria" })

        await expect(
            page.getByRole("button", { name: "Expand Aria" }),
        ).toBeVisible()
        await expect(
            aria.getByRole("img", { name: "Arena (Wins) 0/30" }),
        ).toBeVisible()
        await expect(
            aria.getByRole("checkbox", { name: "Supply Requests, Aria" }),
        ).toBeHidden()
    })

    test("stacks cards in columns, so a minimized one pulls the next up", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await openWithCharacters(page, ["Aria", "Bran", "Cael", "Dara"])

        const aria = page.getByRole("article", { name: "Aria" })
        const dara = page.getByRole("article", { name: "Dara" })
        const before = await dara.boundingBox()

        // Three columns: the fourth card goes under the first.
        expect(before?.x).toBe((await aria.boundingBox())?.x)

        await page.getByRole("button", { name: "Minimize Aria" }).click()
        await expect(
            page.getByRole("button", { name: "Expand Aria" }),
        ).toBeVisible()

        const after = await dara.boundingBox()

        expect(after?.y ?? 0).toBeLessThan(before?.y ?? 0)
    })

    test("lines the Daily / Weekly gap up with the columns, then stacks them", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await openWithCharacters(page, ["Aria", "Bran", "Cael"])

        const siel = page.getByRole("article", { name: "Siel" })
        const daily = siel.getByRole("group", { name: "Daily" })
        const weekly = siel.getByRole("group", { name: "Weekly" })
        const aria = page.getByRole("article", { name: "Aria" })
        const bran = page.getByRole("article", { name: "Bran" })
        // Rounded, as the columns land on fractional pixels.
        const gaps = async () => {
            const boxes = await Promise.all(
                [daily, weekly, aria, bran].map((item) => item.boundingBox()),
            )
            const [d, w, a, b] = boxes.map((box) => {
                return box ?? { x: 0, y: 0, width: 0, height: 0 }
            })

            // Math.abs: a rounded -0 isn't equal to 0 for toEqual.
            return [
                Math.abs(Math.round(d.x + d.width - (a.x + a.width))),
                Math.abs(Math.round(w.x - b.x)),
            ]
        }

        expect(await gaps()).toEqual([0, 0])

        // Narrower, Weekly can't fit two tiles a row beside Daily, so it wraps
        // under it and both take the full width (no reload).
        await page.setViewportSize({ width: 1000, height: 900 })
        await expect
            .poll(async () => {
                const d = await daily.boundingBox()
                const w = await weekly.boundingBox()

                if (!d || !w) {
                    return null
                }

                return {
                    below: w.y >= d.y + d.height,
                    sameWidth: Math.round(d.width) === Math.round(w.width),
                }
            })
            .toEqual({ below: true, sameWidth: true })
    })

    test("fits a phone without sideways scrolling", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await openWithCharacters(page, ["Aria", "Bran", "Cael", "Dara"])

        const overflow = await page.evaluate(() => {
            const root = document.documentElement

            return root.scrollWidth - root.clientWidth
        })

        expect(overflow).toBeLessThanOrEqual(0)
    })
})
