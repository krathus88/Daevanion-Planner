import { describe, expect, it } from "vitest"
import type { BoardNodeAppearance } from "@planner/config/layouts"
import { getNodeStyles } from "./nodeStyles"

const costlyStat: BoardNodeAppearance = {
    name: "Stat",
    label: "",
    backgroundColor: "white",
    type: "basic",
    cost: 3,
    tone: "skill",
}

const styles = (golden: boolean, selected = false) => {
    return getNodeStyles({
        appearance: costlyStat,
        selected: selected,
        adjacentAvailable: false,
        targeted: false,
        canSelect: true,
        golden: golden,
    })
}

describe("getNodeStyles", () => {
    it("draws a stat node in its tone", () => {
        expect(styles(false).borderColor).toBe("board.skill")
        expect(styles(false).orb).toBe("board.orb.skill")
        expect(styles(false).borderWidth).toBe("1px")
    })

    it("draws a special stat node in gold at the tone's size", () => {
        expect(styles(true).borderColor).toBe("board.specialStatBorder")
        expect(styles(true).orb).toBe("board.orb.gold")
        expect(styles(true).size).toBe(styles(false).size)
        expect(styles(true, true).orb).toBe("board.orb.goldLit")
        expect(styles(true, true).borderColor).toBe("board.selected")
    })
})
