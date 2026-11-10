import { describe, expect, it } from "vitest"
import { pickPrices } from "./prices"

describe("pickPrices", () => {
    it("takes shared prices nobody here has set", () => {
        expect(pickPrices(undefined, { 1: { value: 50, at: 10 } })).toEqual({
            1: 50,
        })
    })

    it("takes the newer of local and shared", () => {
        const picked = pickPrices(
            { 1: { value: 60, at: 20 }, 2: { value: 70, at: 5 } },
            { 1: { value: 50, at: 10 }, 2: { value: 80, at: 10 } },
        )

        expect(picked).toEqual({ 1: 60, 2: 80 })
    })

    it("lets a newer local clear hide a shared price", () => {
        const picked = pickPrices(
            { 1: { value: null, at: 20 }, 2: { value: null, at: 5 } },
            { 1: { value: 50, at: 10 }, 2: { value: 80, at: 10 } },
        )

        expect(picked).toEqual({ 2: 80 })
    })

    it("keeps local prices with no shared one", () => {
        expect(pickPrices({ 3: { value: 0, at: 1 } }, {})).toEqual({ 3: 0 })
    })
})
