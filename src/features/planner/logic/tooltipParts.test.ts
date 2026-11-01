import { describe, expect, it } from "vitest"
import { splitTooltip } from "./tooltipParts"

describe("splitTooltip", () => {
    it("keeps plain text whole", () => {
        expect(splitTooltip("Deals damage.")).toEqual([
            { text: "Deals damage.", scaling: false },
        ])
    })

    it("marks X, X% and Xs as scaling", () => {
        expect(splitTooltip("Deals X damage, X% more for Xs.")).toEqual([
            { text: "Deals ", scaling: false },
            { text: "X", scaling: true },
            { text: " damage, ", scaling: false },
            { text: "X%", scaling: true },
            { text: " more for ", scaling: false },
            { text: "Xs", scaling: true },
            { text: ".", scaling: false },
        ])
    })

    it("leaves an X inside a word alone", () => {
        expect(splitTooltip("Xavier's Xylophone")).toEqual([
            { text: "Xavier's Xylophone", scaling: false },
        ])
    })

    it("handles a value at either end", () => {
        expect(splitTooltip("X")).toEqual([{ text: "X", scaling: true }])
    })

    it("returns nothing for an empty tooltip", () => {
        expect(splitTooltip("")).toEqual([])
    })
})
