import type { Locator, Page } from "@playwright/test"
import { expect, test } from "./fixtures"

const KEY = "daevanion:timers:v1:settings"
const LAGTA = "High Commander Lagta"

const readSettings = (page: Page) => {
    return page.evaluate((key) => {
        return JSON.parse(localStorage.getItem(key) ?? "null")
    }, KEY)
}

const openWith = async (page: Page, settings: object) => {
    await page.goto("/timers")
    await page.evaluate(
        ([key, value]) => {
            localStorage.setItem(key as string, JSON.stringify(value))
        },
        [KEY, settings] as const,
    )
    await page.reload()
    await expect(page.getByRole("heading", { name: "Timers" })).toBeVisible()
}

const openOptions = async (page: Page) => {
    await page.goto("/timers")
    await page
        .getByRole("button", {
            name: `Show ${LAGTA}'s loot, timer and colours`,
        })
        .click()
}

test.describe("a boss's options", () => {
    test("entering the in-game timer sets the spawn", async ({ page }) => {
        await page.clock.setFixedTime(new Date("2026-07-01T12:00:00Z"))
        await openOptions(page)
        await page.getByRole("textbox", { name: "Hours" }).fill("1")
        await page.getByRole("textbox", { name: "Minutes" }).fill("30")
        await page.getByRole("button", { name: "Update" }).click()

        await expect
            .poll(async () => {
                const settings = await readSettings(page)

                return Object.values(settings?.bossReports ?? {})[0]
            })
            .toMatchObject({
                spawnAt: Date.parse("2026-07-01T13:30:00Z"),
            })
    })

    test("a set timer can be cleared", async ({ page }) => {
        await page.goto("/timers")
        await page.getByRole("button", { name: "Killed" }).nth(1).click()
        await expect
            .poll(async () => {
                return Object.keys((await readSettings(page)).bossReports)
            })
            .toHaveLength(1)

        await page
            .getByRole("button", {
                name: `Show ${LAGTA}'s loot, timer and colours`,
            })
            .click()
        await page.getByRole("button", { name: "Clear timer" }).first().click()

        await expect
            .poll(async () => {
                return Object.keys((await readSettings(page)).bossReports)
            })
            .toHaveLength(0)
    })

    test("lists its loot", async ({ page }) => {
        await openOptions(page)

        const loot = page.getByRole("button", { name: /^Loot · \d+/ }).first()

        await loot.click()

        await expect(loot).toHaveAttribute("aria-expanded", "true")
    })

    test("customising saves the soon time and colour", async ({ page }) => {
        await openOptions(page)
        await page.getByRole("button", { name: "Customise" }).click()

        await page.getByLabel("Minutes before it starts").first().fill("7")

        await expect
            .poll(async () => {
                return Object.values((await readSettings(page)).soonMinutes)
            })
            .toEqual([7])

        await page
            .getByRole("radiogroup", { name: "Colour" })
            .or(page.getByRole("group", { name: "Colour" }))
            .first()
            .getByRole("radio")
            .or(
                page
                    .getByRole("group", { name: "Colour" })
                    .first()
                    .getByRole("button"),
            )
            .first()
            .click({ force: true })

        await expect
            .poll(async () => {
                return Object.keys((await readSettings(page)).colors)
            })
            .toHaveLength(1)
    })

    test("toggles Coming next", async ({ page }) => {
        await page.goto("/timers")
        await page
            .getByRole("button", { name: `Add ${LAGTA} to Coming next` })
            .click()

        await expect(
            page.getByRole("button", {
                name: `Remove ${LAGTA} from Coming next`,
            }),
        ).toBeVisible()
        await expect
            .poll(async () => {
                return Object.values((await readSettings(page)).comingNext)
            })
            .toEqual([true])
    })
})

test.describe("server and sharing", () => {
    test("a server of the other faction swaps the region", async ({ page }) => {
        await openWith(page, { server: "israphel" })

        await expect(page.getByRole("radio", { name: /Altgard/ })).toBeChecked()
        // Lagta is on both factions' maps, in different zones.
        await expect(page.getByText(/Ragta Fortress/).first()).toBeVisible()
        await expect(page.getByText(/Red Forest/)).toBeHidden()
    })

    test("the server list saves a choice", async ({ page }) => {
        await page.goto("/timers")
        await page
            .getByRole("combobox", { name: "Server" })
            .selectOption({ label: "Nezekan" })

        await expect
            .poll(async () => {
                return (await readSettings(page)).server
            })
            .toBe("nezekan")
    })

    test("shared timers can be turned off", async ({ page }) => {
        await page.goto("/timers")
        await page.getByRole("button", { name: "Sharing" }).click()

        await expect(
            page.getByRole("button", { name: "Log in with Discord" }).first(),
        ).toBeVisible()

        await page.getByText("Shared boss timers", { exact: true }).click()

        await expect
            .poll(async () => {
                return (await readSettings(page)).showShared
            })
            .toBe(false)
    })
})

test.describe("Coming next", () => {
    const strip = (page: Page) => {
        return page.getByLabel("Coming next", { exact: true })
    }

    test("right-clicking changes how many it shows", async ({ page }) => {
        await openWith(page, { showComingNext: true, comingNextCount: 4 })

        await strip(page).click({ button: "right" })
        await page.getByRole("button", { name: "Show more timers" }).click()

        await expect
            .poll(async () => {
                return (await readSettings(page)).comingNextCount
            })
            .toBe(5)

        await page.getByRole("button", { name: "Show fewer timers" }).click()

        await expect
            .poll(async () => {
                return (await readSettings(page)).comingNextCount
            })
            .toBe(4)
    })

    test("shows its drag handle and hide button only on hover", async ({
        page,
    }) => {
        // Mid-screen, so a growth left out of its width would move the timers.
        await openWith(page, {
            showComingNext: true,
            comingNextPosition: { dock: "free", fx: 0.5, fy: 0.3 },
        })

        const handle = page.getByTitle("Drag to move")
        const hide = page.getByTitle("Hide coming next")

        const widthOf = async (locator: Locator) => {
            return (await locator.boundingBox())?.width ?? 0
        }

        await expect(handle).toHaveCSS("opacity", "0")
        await expect(hide).toHaveCSS("opacity", "0")
        // The button's transparent border is all that's left.
        expect(await widthOf(handle)).toBe(0)
        expect(await widthOf(hide)).toBeLessThanOrEqual(2)

        const firstTimer = page.locator("#coming-next-list > *").first()
        const timerLeft = (await firstTimer.boundingBox())?.x

        await strip(page).hover()

        await expect(handle).toHaveCSS("opacity", "1")
        await expect(hide).toHaveCSS("opacity", "1")
        // The strip slides left as the handle grows, so the timers stay put.
        expect((await firstTimer.boundingBox())?.x).toBeCloseTo(
            timerLeft ?? Number.NaN,
            0,
        )
        await expect.poll(() => widthOf(handle)).toBeGreaterThan(10)
        await expect.poll(() => widthOf(hide)).toBeGreaterThan(20)

        await page.mouse.move(0, 0)

        await expect(hide).toHaveCSS("opacity", "0")
        await expect.poll(() => widthOf(hide)).toBeLessThanOrEqual(2)
    })

    test("keeps its timers still on every frame as it unfolds", async ({
        page,
    }) => {
        await openWith(page, {
            showComingNext: true,
            comingNextPosition: { dock: "free", fx: 0.37, fy: 0.3 },
        })

        // The first timer's left edge on every frame for a second.
        const sampleTimerLefts = () => {
            return page.evaluate(async () => {
                const timer = document.querySelector("#coming-next-list > *")
                const lefts: number[] = []
                const start = performance.now()

                while (timer && performance.now() - start < 1000) {
                    lefts.push(timer.getBoundingClientRect().left)
                    await new Promise(requestAnimationFrame)
                }

                return lefts
            })
        }

        const unfolding = sampleTimerLefts()
        await strip(page).hover()
        const unfoldLefts = await unfolding

        const folding = sampleTimerLefts()
        await page.mouse.move(0, 0)
        const lefts = [...unfoldLefts, ...(await folding)]

        expect(lefts.length).toBeGreaterThan(40)
        expect(Math.max(...lefts) - Math.min(...lefts)).toBeLessThan(0.05)
    })

    test("keeps its toggle when collapsed", async ({ page }) => {
        await page.goto("/timers")

        await expect(page.getByTitle("Show coming next")).toHaveCSS(
            "opacity",
            "1",
        )
    })

    test("dragging moves it and saves the place", async ({ page }) => {
        await openWith(page, { showComingNext: true })

        // The handle only unfolds while the strip is hovered.
        const handle = page.getByTitle("Drag to move")
        await strip(page).hover()
        await expect(handle).toHaveCSS("opacity", "1")
        const box = await handle.boundingBox()

        if (!box) {
            throw new Error("No drag handle.")
        }

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(600, 500, { steps: 8 })
        await page.mouse.up()

        await expect
            .poll(async () => {
                return (await readSettings(page)).comingNextPosition
            })
            .toMatchObject({ dock: "free" })
    })

    test("starts collapsed and opens from its toggle", async ({ page }) => {
        await page.goto("/timers")

        await page.getByTitle("Show coming next").click()

        await expect(page.getByTitle("Hide coming next")).toBeVisible()
        await expect
            .poll(async () => {
                return (await readSettings(page)).showComingNext
            })
            .toBe(true)
    })
})

test.describe("the pinned layout editor", () => {
    test("opens and shows what's pinned", async ({ page }) => {
        await page.goto("/timers")
        await page.getByRole("button", { name: "Edit layout" }).click()

        await expect(page.getByText(/As shown in the header/)).toBeVisible()
    })

    test("explains an empty layout", async ({ page }) => {
        await openWith(page, { pinned: [] })
        await page.getByRole("button", { name: "Edit layout" }).click()

        await expect(page.getByText(/Nothing pinned yet/)).toBeVisible()
    })

    test("dragging a timer onto another swaps them", async ({ page }) => {
        await openWith(page, { pinned: [["daily"], ["weekly"]] })
        await page.getByRole("button", { name: "Edit layout" }).click()
        await expect(page.getByText(/As shown in the header/)).toBeVisible()
        // The editor loads with dnd-kit and slides open.
        await page.waitForTimeout(800)

        const main = page.getByRole("main")
        const from = await main
            .getByText("Daily", { exact: true })
            .first()
            .boundingBox()
        const to = await main
            .getByText("Weekly", { exact: true })
            .first()
            .boundingBox()

        if (!from || !to) {
            throw new Error("Pinned timers not found in the editor.")
        }

        await page.mouse.move(from.x + 5, from.y + 5)
        await page.mouse.down()
        await page.waitForTimeout(300)
        await page.mouse.move(from.x + 20, from.y + 5, { steps: 4 })
        await page.mouse.move(to.x + 5, to.y + 5, { steps: 10 })
        await page.waitForTimeout(200)
        await page.mouse.up()

        await expect
            .poll(async () => {
                return (await readSettings(page)).pinned
            })
            .toEqual([["weekly"], ["daily"]])
    })
})
