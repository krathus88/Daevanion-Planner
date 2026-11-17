import { describe, expect, it } from "vitest"
import { EMPTY_WINDOW_FILTERS, setWindowFilters } from "./windowFilters"

describe("setWindowFilters", () => {
    it("changes one window's filters, leaving the other's", () => {
        const filters = setWindowFilters(EMPTY_WINDOW_FILTERS, "transfer", {
            query: "ring",
        })

        expect(filters.transfer.query).toBe("ring")
        expect(filters.crafting.query).toBe("")
    })

    it("starts a new profession at All", () => {
        const picked = setWindowFilters(EMPTY_WINDOW_FILTERS, "crafting", {
            profession: "blacksmithing",
            category: "mace",
        })
        const changed = setWindowFilters(picked, "crafting", {
            profession: "cooking",
        })

        expect(picked.crafting.category).toBe("mace")
        expect(changed.crafting).toMatchObject({
            profession: "cooking",
            category: null,
        })
    })
})
