// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { readSyncMeta } from "@account/sync/syncMeta"
import { CRAFTING_KEY } from "@account/sync/syncedKeys"
import { makeCraftingSettings } from "@test/craftingFixture"
import {
    parseCraftingSettings,
    readCraftingSettings,
    subscribeToCraftingSettings,
    writeCraftingSettings,
} from "./craftingSettings"

afterEach(() => {
    localStorage.clear()
})

describe("parseCraftingSettings", () => {
    it("reads a full save", () => {
        const settings = makeCraftingSettings({
            server: "israphel",
            owned: { 1: 5 },
            character: "Testchar",
            prices: {
                siel: { 1: { value: 0, at: 5 }, 2: { value: null, at: 6 } },
                israphel: { 1: { value: 40000, at: 7 } },
            },
            bought: [10],
            success: { 20: 75 },
            proficiency: { blacksmithing: 61, cooking: 1 },
        })

        expect(parseCraftingSettings(settings)).toEqual(settings)
    })

    it("drops bad entries one by one", () => {
        expect(
            parseCraftingSettings({
                server: "nowhere",
                owned: { 1: 5, 2: -1, 3: 1.5, 4: "x" },
                character: 5,
                prices: {
                    siel: {
                        1: { value: 10, at: 1 },
                        2: { value: -5, at: 1 },
                        3: { value: 10 },
                        4: 10,
                    },
                    nowhere: { 1: { value: 10, at: 1 } },
                },
                bought: [10, 10, "x", 2.5],
                success: { 1: 50, 2: 0, 3: 101 },
                proficiency: {
                    alchemy: 30,
                    tailoring: 5,
                    cooking: 0,
                    armorsmithing: 999,
                },
            }),
        ).toEqual({
            server: "siel",
            owned: { 1: 5 },
            character: null,
            prices: { siel: { 1: { value: 10, at: 1 } } },
            bought: [10],
            success: { 1: 50 },
            proficiency: { alchemy: 30 },
        })
    })

    it("starts empty from anything else", () => {
        expect(parseCraftingSettings("broken")).toEqual(makeCraftingSettings())
    })
})

describe("crafting storage", () => {
    it("saves through sync and reads it back", () => {
        const settings = makeCraftingSettings({ owned: { 1: 3 } })

        writeCraftingSettings(settings)

        expect(readCraftingSettings()).toEqual(settings)
        expect(readSyncMeta().pending).toContain(CRAFTING_KEY)
    })

    it("keeps the same object until the save changes", () => {
        localStorage.setItem(CRAFTING_KEY, "{bad json")

        expect(readCraftingSettings()).toBe(readCraftingSettings())
        expect(readCraftingSettings()).toEqual(makeCraftingSettings())
    })

    it("tells subscribers about saves here and in other tabs", () => {
        const onChange = vi.fn()
        const unsubscribe = subscribeToCraftingSettings(onChange)

        writeCraftingSettings(makeCraftingSettings())
        window.dispatchEvent(new StorageEvent("storage", { key: CRAFTING_KEY }))
        window.dispatchEvent(new StorageEvent("storage", { key: "other" }))
        unsubscribe()
        writeCraftingSettings(makeCraftingSettings())

        expect(onChange).toHaveBeenCalledTimes(2)
    })
})
