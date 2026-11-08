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
// them saved.
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

    test("reorders characters and tasks by dragging", async ({ page }) => {
        await openWithCharacters(page, ["Aria", "Bran"])

        // dnd-kit needs a few moves to start a drag and settle on its target.
        // Positions are read once the dialog has finished opening; hovering
        // scrolls the handle into view.
        const drag = async (from: string, to: string, dialog: string) => {
            const scope = page.getByRole("dialog", { name: dialog })
            const source = scope.getByRole("button", { name: `Drag ${from}` })

            await scope.evaluate((element) => {
                return Promise.all(
                    element
                        .getAnimations({ subtree: true })
                        .map((animation) => animation.finished),
                )
            })
            await source.hover()

            const handle = await source.boundingBox()
            const target = await scope
                .getByRole("button", { name: `Drag ${to}` })
                .boundingBox()

            if (!handle || !target) {
                throw new Error("Drag handles not found")
            }

            await page.mouse.move(
                handle.x + handle.width / 2,
                handle.y + handle.height / 2,
            )
            await page.mouse.down()
            await page.mouse.move(handle.x + handle.width / 2, handle.y, {
                steps: 3,
            })
            await page.mouse.move(target.x + target.width / 2, target.y, {
                steps: 15,
            })
            await page.mouse.move(target.x + target.width / 2, target.y - 1)
            await page.mouse.up()
        }

        await page.getByRole("button", { name: "Characters" }).click()
        await drag("Bran", "Aria", "Characters")

        await expect
            .poll(async () => {
                return page.evaluate((key) => {
                    const data = JSON.parse(localStorage.getItem(key) ?? "{}")

                    return data.characters.map(
                        (character: { name: string }) => character.name,
                    )
                }, KEY)
            })
            .toEqual(["Bran", "Aria"])

        await page.keyboard.press("Escape")
        await page.getByRole("button", { name: "Tasks" }).click()
        await drag("Shugo Festival (server)", "Duty Missions (server)", "Tasks")

        await expect
            .poll(async () => {
                return page.evaluate((key) => {
                    const data = JSON.parse(localStorage.getItem(key) ?? "{}")

                    return data.tasks
                        ?.slice(2, 4)
                        .map((task: { id: string }) => task.id)
                }, KEY)
            })
            .toEqual(["shugo-festival", "duty-missions"])
    })

    test("ticks tasks per character and keeps them", async ({ page }) => {
        await page.clock.setFixedTime(TUESDAY)
        await openWithCharacters(page, ["Aria", "Bran"])

        await page
            .getByRole("button", { name: "Supply Requests, Aria: 1 of 1" })
            .click()

        // Leaving the card moves the done task into its Done section.
        const aria = page.getByRole("article", { name: "Aria" })

        await page.mouse.move(0, 0)
        await expect(
            aria.getByRole("button", { name: /^Done · 1/ }),
        ).toBeVisible()

        await page
            .getByRole("button", { name: "Battlefield (Wins), Bran: 1 of 3" })
            .click()

        await page.reload()

        // Done tasks open in the card's collapsed Done section.
        await aria.getByRole("button", { name: /^Done · 1/ }).click()
        await expect(
            page.getByRole("button", { name: "Supply Requests, Aria: 1 of 1" }),
        ).toHaveAttribute("aria-pressed", "true")
        await expect(
            page.getByRole("button", { name: "Supply Requests, Bran: 1 of 1" }),
        ).toHaveAttribute("aria-pressed", "false")
        await expect(
            page.getByRole("button", {
                name: "Battlefield (Wins), Bran: 1 of 3",
            }),
        ).toHaveAttribute("aria-pressed", "true")
    })

    test("clears dailies and weeklies at their resets", async ({ page }) => {
        await page.clock.install({ time: TUESDAY })
        await openWithCharacters(page, ["Aria"])

        const firstTrial = page.getByRole("button", {
            name: "Battlefield (Wins), Aria: 1 of 3",
        })

        await page
            .getByRole("button", { name: "Supply Requests, Aria: 1 of 1" })
            .click()
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
            page.getByRole("button", { name: "Supply Requests, Aria: 1 of 1" }),
        ).toHaveAttribute("aria-pressed", "false")
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
            aria.getByRole("img", { name: "Arena 5v5 (Wins) 0/30" }),
        ).toBeVisible()
        await expect(
            aria.getByRole("button", { name: "Supply Requests, Aria: 1 of 1" }),
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

    test("puts a wide control beside the name when the tile has room", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await openWithCharacters(page, ["Aria"])

        const aria = page.getByRole("article", { name: "Aria" })
        const name = aria.getByText("Ascension Trial", { exact: true })
        const use = aria.getByRole("button", {
            name: "Use one: Ascension Trial, Aria",
        })
        // Where the Use button sits against the name: beside it or under it.
        const place = async () => {
            const n = await name.boundingBox()
            const u = await use.boundingBox()

            if (!n || !u) {
                return null
            }

            return u.y >= n.y + n.height ? "under" : "beside"
        }

        await expect.poll(place).toBe("beside")

        // A phone's tiles are too narrow, so it goes under the name.
        await page.setViewportSize({ width: 390, height: 844 })
        await expect.poll(place).toBe("under")
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
