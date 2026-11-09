import { readFileSync } from "node:fs"
import type { Page } from "@playwright/test"
import { expect, test } from "./fixtures"

const BOARD = "/planner/gladiator/nezekan"
const PREFIX = "daevanion:v1:gladiator:nezekan"

const ROUTE = {
    selectedCells: [],
    availablePoints: 225,
    targetCells: ["4,5"],
    plannedPath: ["4,5"],
    plannedCost: 1,
}

const saved = (name: string, path = ["4,5", "4,6"]) => {
    return {
        id: name,
        name: name,
        createdAt: 1,
        availablePoints: 225,
        targetCells: path,
        plannedPath: path,
        plannedCost: path.length,
    }
}

// Opens the board with these localStorage values already saved.
const openWith = async (page: Page, values: Record<string, unknown>) => {
    await page.goto(BOARD)
    await page.evaluate((entries) => {
        for (const [key, value] of Object.entries(entries)) {
            localStorage.setItem(key, JSON.stringify(value))
        }
    }, values)
    await page.reload()
    await expect(page.getByRole("img", { name: "Start node" })).toBeVisible()
}

const readStored = (page: Page, key: string) => {
    return page.evaluate((storageKey) => {
        return JSON.parse(localStorage.getItem(storageKey) ?? "null")
    }, key)
}

const openSaved = async (page: Page) => {
    await page.getByRole("tab", { name: "Saved" }).click()

    return page.getByRole("tabpanel", { name: "Saved" })
}

test.describe("saved routes", () => {
    test("saves the current route under a name", async ({ page }) => {
        await openWith(page, { [`${PREFIX}:progress`]: ROUTE })

        const panel = await openSaved(page)

        await panel
            .getByRole("textbox", { name: "Name this route" })
            .fill("Mine")
        await panel.getByRole("button", { name: "Save" }).first().click()

        await expect(panel.getByText("Mine", { exact: true })).toBeVisible()
        expect(await readStored(page, `${PREFIX}:saved-planners`)).toHaveLength(
            1,
        )

        await page.reload()

        await expect(
            (await openSaved(page)).getByText("Mine", { exact: true }),
        ).toBeVisible()
    })

    test("loads a saved route onto the board", async ({ page }) => {
        await openWith(page, { [`${PREFIX}:saved-planners`]: [saved("Old")] })

        const panel = await openSaved(page)

        await panel.getByRole("button", { name: "Load" }).click()

        await page.getByRole("tab", { name: "This board" }).click()
        await expect(
            page.getByText("Old", { exact: true }).first(),
        ).toBeVisible()

        expect(await readStored(page, `${PREFIX}:progress`)).toMatchObject({
            plannedPath: ["4,5", "4,6"],
            activePlanner: { id: "Old", source: "saved" },
        })
    })

    test("renames and deletes a saved route", async ({ page }) => {
        await openWith(page, { [`${PREFIX}:saved-planners`]: [saved("Old")] })

        const panel = await openSaved(page)

        await panel.getByRole("button", { name: "Rename Old" }).click()
        await panel.getByLabel("New name for Old").fill("New")
        await page.keyboard.press("Enter")
        await expect(panel.getByText("New", { exact: true })).toBeVisible()

        await panel.getByRole("button", { name: "Delete New" }).click()

        await expect(
            panel.getByText("Saved routes show up here."),
        ).toBeVisible()
        expect(await readStored(page, `${PREFIX}:saved-planners`)).toEqual([])
    })

    test("keeps an optimizer run from history", async ({ page }) => {
        await openWith(page, { [`${PREFIX}:planner-history`]: [saved("Run")] })

        const panel = await openSaved(page)

        await panel.getByRole("button", { name: "Optimizer history" }).click()
        await expect(panel.getByText("Run", { exact: true })).toBeVisible()
        await panel.getByRole("button", { name: "Delete Run" }).click()

        await expect(
            panel.getByText("Each optimizer run is recorded here."),
        ).toBeVisible()
    })
})

test.describe("clear and undo", () => {
    test("clears a route and brings it back", async ({ page }) => {
        await openWith(page, { [`${PREFIX}:progress`]: ROUTE })

        await page.getByRole("button", { name: "Clear planner" }).click()
        expect(await readStored(page, `${PREFIX}:progress`)).toMatchObject({
            plannedCost: null,
        })

        await page.getByRole("button", { name: "Restore previous" }).click()
        await expect
            .poll(() => readStored(page, `${PREFIX}:progress`))
            .toMatchObject({ plannedCost: 1 })
    })

    test("resets manual picks and brings them back", async ({ page }) => {
        await openWith(page, {
            [`${PREFIX}:progress`]: { ...ROUTE, selectedCells: ["4,5"] },
        })
        await page.getByText("Manual", { exact: true }).click()

        await page.getByRole("button", { name: "Reset selection" }).click()
        await expect
            .poll(() => readStored(page, `${PREFIX}:progress`))
            .toMatchObject({ selectedCells: [] })

        await page.getByRole("button", { name: "Restore previous" }).click()
        await expect
            .poll(() => readStored(page, `${PREFIX}:progress`))
            .toMatchObject({ selectedCells: ["4,5"] })
    })

    test("a running search can be cancelled", async ({ page }) => {
        await openWith(page, { [`${PREFIX}:progress`]: ROUTE })

        await page
            .getByRole("combobox", { name: "Stop after no improvement for" })
            .selectOption({ label: "5m" })
        await page.getByRole("button", { name: "Find a good path" }).click()
        await page.getByRole("button", { name: "Cancel" }).click()

        await expect(
            page.getByRole("button", { name: "Find a good path" }),
        ).toBeEnabled()
    })

    test("a running search can stop early and keep its route", async ({
        page,
    }) => {
        await openWith(page, { [`${PREFIX}:progress`]: ROUTE })

        await page
            .getByRole("combobox", { name: "Stop after no improvement for" })
            .selectOption({ label: "5m" })
        await page.getByRole("button", { name: "Find a good path" }).click()
        await expect(page.getByText(/No better route for/)).toBeVisible()
        await page.getByRole("button", { name: "Stop & keep" }).click()

        await expect(
            page.getByRole("button", { name: "Find a good path" }),
        ).toBeEnabled()
        await expect(
            page.getByText(/saved to optimization history/),
        ).toBeVisible()
    })

    test("Ariel's search keeps improving until stopped", async ({ page }) => {
        await openWith(page, {
            "daevanion:v1:gladiator:settings": { ariel: { points: 120 } },
        })
        await page.goto("/planner/gladiator/ariel")

        await page
            .getByRole("combobox", { name: "Stop after no improvement for" })
            .selectOption({ label: "5m" })
        await page.getByRole("button", { name: "Find a good path" }).click()
        await expect(page.getByText(/Checking routes/)).toBeVisible()
        await expect(page.getByText(/No better route for/)).toBeVisible()
        await page.getByRole("button", { name: "Stop & keep" }).click()

        await expect(
            page.getByText(/saved to optimization history/),
        ).toBeVisible()
        expect(
            await readStored(page, "daevanion:v1:gladiator:ariel:progress"),
        ).toMatchObject({ plannedCost: 120 })
    })
})

test.describe("manual boards", () => {
    test("saves and loads", async ({ page }) => {
        await openWith(page, {
            [`${PREFIX}:progress`]: { ...ROUTE, selectedCells: ["4,5"] },
        })

        const panel = await openSaved(page)

        await panel.getByRole("button", { name: "Manual boards" }).click()
        await panel
            .getByRole("textbox", { name: "Name this board" })
            .fill("Picks")
        await panel.getByRole("button", { name: "Save" }).last().click()

        await expect(panel.getByText("Picks", { exact: true })).toBeVisible()
        expect(await readStored(page, `${PREFIX}:saved-boards`)).toMatchObject([
            { name: "Picks", selectedCells: ["4,5"] },
        ])
    })
})

test.describe("backup and share", () => {
    const openBackup = async (page: Page) => {
        const panel = await openSaved(page)

        await panel.getByRole("button", { name: "Backup & share" }).click()

        return panel
    }

    test("a backup file restores on a fresh device", async ({ page }) => {
        await openWith(page, {
            [`${PREFIX}:saved-planners`]: [saved("Keep me")],
        })

        const panel = await openBackup(page)
        const [download] = await Promise.all([
            page.waitForEvent("download"),
            panel.getByRole("button", { name: "Export file" }).click(),
        ])

        expect(download.suggestedFilename()).toMatch(
            /^daevanion-planner-backup-.*\.json$/,
        )

        const file = readFileSync(await download.path(), "utf-8")

        await page.evaluate(() => {
            localStorage.clear()
        })
        await page.reload()

        const fresh = await openBackup(page)
        const [chooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            fresh.getByRole("button", { name: "Import file" }).click(),
        ])

        await chooser.setFiles({
            name: "backup.json",
            mimeType: "application/json",
            buffer: Buffer.from(file),
        })
        await page.getByRole("button", { name: "Import", exact: true }).click()

        await expect
            .poll(() => readStored(page, `${PREFIX}:saved-planners`))
            .toMatchObject([{ name: "Keep me (imported)" }])
    })

    test("explains a file that isn't a backup", async ({ page }) => {
        await page.goto(BOARD)

        const panel = await openBackup(page)
        const [chooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            panel.getByRole("button", { name: "Import file" }).click(),
        ])

        await chooser.setFiles({
            name: "notes.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("hello"),
        })

        await expect(
            page.getByText(/isn't a Daevanion Planner backup/),
        ).toBeVisible()
    })

    test("a share link opens the plan and saves a copy", async ({ page }) => {
        await openWith(page, { [`${PREFIX}:progress`]: ROUTE })

        const panel = await openBackup(page)

        await panel.getByRole("button", { name: "Link to Nezekan" }).click()

        const link = panel.getByRole("textbox", { name: "Share link" })

        await expect(link).toHaveValue(/share=/)

        const url = await link.inputValue()

        await page.evaluate(() => {
            localStorage.clear()
        })
        await page.goto(url)

        await page.getByLabel("Name for the saved plan").fill("From a friend")
        await page.getByRole("button", { name: /^Save/ }).first().click()

        await expect
            .poll(() => readStored(page, `${PREFIX}:saved-planners`))
            .toMatchObject([{ name: "From a friend" }])
    })
})

test.describe("all boards panels", () => {
    const openAll = async (page: Page) => {
        await page.getByRole("tab", { name: "All boards" }).click()

        return page.getByRole("tabpanel", { name: "All boards" })
    }

    test("compare loads a saved route onto its board", async ({ page }) => {
        await openWith(page, { [`${PREFIX}:saved-planners`]: [saved("Old")] })

        const panel = await openAll(page)

        await panel
            .getByRole("button", { name: /Compare saved routes/ })
            .click()
        await panel
            .getByRole("combobox", { name: "Nezekan" })
            .selectOption({ label: "Old · 2 pts" })

        await expect(panel.getByText("364 left")).toBeVisible()
        expect(await readStored(page, `${PREFIX}:progress`)).toMatchObject({
            plannedCost: 2,
        })
    })

    test("saves Ariel's points", async ({ page }) => {
        await page.goto(BOARD)

        const panel = await openAll(page)

        await panel.getByRole("button", { name: "Ariel", exact: true }).click()
        await panel.getByRole("textbox", { name: "Ariel points" }).fill("30")

        await expect
            .poll(() => readStored(page, "daevanion:v1:gladiator:settings"))
            .toMatchObject({ ariel: { points: 30 } })
    })

    test("every priorities panel opens", async ({ page }) => {
        await page.goto(BOARD)

        const panel = await openAll(page)

        await panel
            .getByRole("button", { name: "Optimizer priorities" })
            .click()

        for (const name of [
            "Special node priorities",
            "Ability priorities",
            "Same-rank order",
        ]) {
            const section = panel.getByRole("button", { name: name })

            await section.click()
            await expect(section).toHaveAttribute("aria-expanded", "true")
        }
    })

    test("dragging an ignored stat onto a rank joins it", async ({ page }) => {
        await page.goto(BOARD)

        const panel = await openAll(page)

        await panel
            .getByRole("button", { name: "Optimizer priorities" })
            .click()
        await panel.getByRole("button", { name: "Stat priorities" }).click()

        const handle = panel.getByRole("button", { name: "Drag Max MP" })
        const target = panel.getByRole("button", { name: "Drag Attack" })
        // The sidebar scrolls on its own; the mouse only reaches what's shown,
        // and both rows fit once the bottom one is in view.
        await page.setViewportSize({ width: 1280, height: 1000 })
        await handle.scrollIntoViewIfNeeded()
        await expect(target).toBeInViewport()
        // hover() measures the handle when it acts, after the section's
        // open animation.
        await handle.hover()
        await page.mouse.down()
        const from = await handle.boundingBox()
        const before = await target.boundingBox()

        if (!from || !before) {
            throw new Error("No drag handles.")
        }

        // A first nudge starts the drag, which mustn't shift the list.
        await page.mouse.move(from.x + from.width / 2, from.y, { steps: 3 })
        await expect(handle).toHaveAttribute("aria-pressed", "true")
        const to = await target.boundingBox()

        if (!to) {
            throw new Error("No drop target.")
        }

        expect(to.y).toBe(before.y)

        const x = to.x + to.width / 2
        const y = to.y + to.height / 2
        await page.mouse.move(x, y, { steps: 15 })
        // The drop target settles a frame after the last move.
        await page.mouse.move(x, y + 1)
        await page.mouse.up()

        await expect
            .poll(async () => {
                const settings = await readStored(
                    page,
                    "daevanion:v1:gladiator:settings",
                )
                return {
                    ranked: settings?.stats?.order?.slice(0, 3),
                    ignored: settings?.stats?.ignored,
                }
            })
            .toEqual({
                ranked: ["attack", "critical-hit", "max-mp"],
                ignored: [],
            })
        // Ranked now, so it can be maxed.
        await expect(
            panel.getByRole("checkbox", { name: "Max Max MP" }),
        ).toBeAttached()
    })

    test("route preferences list this board's nodes", async ({ page }) => {
        await page.goto(BOARD)

        const section = page
            .getByRole("tabpanel", { name: "This board" })
            .getByRole("button", { name: "Route preferences", exact: true })

        await section.click()

        await expect(section).toHaveAttribute("aria-expanded", "true")
        await expect(page.getByText("Abilities", { exact: true })).toBeVisible()
    })
})

test.describe("checking against the game", () => {
    test("reports a screenshot with no board in it", async ({ page }) => {
        await page.goto(BOARD)
        await page
            .getByRole("tabpanel", { name: "This board" })
            .getByRole("button", { name: "Check screenshots" })
            .click()

        const dialog = page.getByRole("dialog")
        const png = await page.evaluate(() => {
            const canvas = document.createElement("canvas")

            canvas.width = 600
            canvas.height = 600

            return canvas.toDataURL("image/png").split(",")[1]
        })

        await dialog.locator('input[type="file"]').setInputFiles({
            name: "not-a-board.png",
            mimeType: "image/png",
            buffer: Buffer.from(png, "base64"),
        })

        await expect(dialog).toContainText("not-a-board.png", {
            timeout: 20_000,
        })
    })
})

test.describe("sidebar tabs", () => {
    test("the open tab stays open across board and class switches", async ({
        page,
    }) => {
        await page.goto(BOARD)
        await openSaved(page)

        await page
            .getByRole("navigation", { name: "Select board" })
            .getByRole("link", { name: /zikel/i })
            .click()
        await expect(page).toHaveURL(/\/zikel$/)
        await expect(page.getByRole("tab", { name: "Saved" })).toHaveAttribute(
            "aria-selected",
            "true",
        )

        await page.getByRole("combobox", { name: "Class" }).click()
        await page.getByRole("option", { name: "Cleric" }).click()
        await expect(page).toHaveURL(/\/cleric\/zikel$/)
        await expect(page.getByRole("tab", { name: "Saved" })).toHaveAttribute(
            "aria-selected",
            "true",
        )
    })
})
