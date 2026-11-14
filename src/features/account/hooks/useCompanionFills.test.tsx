import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { useCompanionFills, useCompanionUsed } from "./useCompanionFills"

const KRYX = {
    v: 1,
    character: { name: "Kryx", server: 1301, class: 30 },
    pets: { "1192": [2, 49] },
    petsAt: 10,
}

const read = () => {
    return renderHook(() => {
        return {
            used: useCompanionUsed(),
            pets: useCompanionFills("pets"),
            items: useCompanionFills("items"),
        }
    }).result.current
}

describe("useCompanionFills", () => {
    afterEach(() => {
        window.localStorage.clear()
    })

    it("locks nothing before the companion app sent anything", () => {
        expect(read()).toEqual({ used: false, pets: false, items: false })
    })

    it("locks what it sent, whether it runs or not", () => {
        window.localStorage.setItem(
            "daevanion:game:v1:1301:Kryx",
            JSON.stringify(KRYX),
        )

        expect(read()).toEqual({ used: true, pets: true, items: false })
    })
})
