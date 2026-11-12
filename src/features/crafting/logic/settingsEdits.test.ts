import { describe, expect, it } from "vitest"
import { makeCraftingSettings } from "@test/craftingFixture"
import {
    setBought,
    setCharacter,
    setOwned,
    setPrice,
    setProficiency,
    setServer,
    setSuccess,
} from "./settingsEdits"

describe("settings edits", () => {
    it("changes the server", () => {
        expect(setServer(makeCraftingSettings(), "israphel").server).toBe(
            "israphel",
        )
    })

    it("picks the character whose soulbound items count", () => {
        const settings = setCharacter(makeCraftingSettings(), "Testchar")

        expect(settings.character).toBe("Testchar")
        expect(setCharacter(settings, null).character).toBeNull()
    })

    it("saves bag counts and drops zero", () => {
        const settings = setOwned(makeCraftingSettings(), 5, 12)

        expect(settings.owned).toEqual({ 5: 12 })
        expect(setOwned(settings, 5, 0).owned).toEqual({})
    })

    it("keeps prices per server, with when they were set", () => {
        const siel = setPrice(makeCraftingSettings(), 5, 0, 100)
        const both = setPrice(setServer(siel, "israphel"), 5, 70, 200)

        expect(both.prices).toEqual({
            siel: { 5: { value: 0, at: 100 } },
            israphel: { 5: { value: 70, at: 200 } },
        })
    })

    it("keeps a cleared price, so it can hide an older shared one", () => {
        const settings = setPrice(makeCraftingSettings(), 5, null, 300)

        expect(settings.prices.siel).toEqual({ 5: { value: null, at: 300 } })
    })

    it("keeps success within 1-100", () => {
        expect(setSuccess(makeCraftingSettings(), 5, 0).success).toEqual({
            5: 1,
        })
        expect(setSuccess(makeCraftingSettings(), 5, 250).success).toEqual({
            5: 100,
        })
        expect(setSuccess(makeCraftingSettings(), 5, 60).success).toEqual({
            5: 60,
        })
    })

    it("clears a success set by hand back to the game's table", () => {
        const settings = setSuccess(makeCraftingSettings(), 5, 60)

        expect(setSuccess(settings, 5, null).success).toEqual({})
    })

    it("sets and clears a profession's proficiency", () => {
        const settings = setProficiency(
            makeCraftingSettings(),
            "blacksmithing",
            61,
        )

        expect(settings.proficiency).toEqual({ blacksmithing: 61 })
        expect(
            setProficiency(settings, "blacksmithing", null).proficiency,
        ).toEqual({})
    })

    it("adds and removes bought items once", () => {
        const settings = setBought(
            setBought(makeCraftingSettings(), 5, true),
            5,
            true,
        )

        expect(settings.bought).toEqual([5])
        expect(setBought(settings, 5, false).bought).toEqual([])
    })
})
