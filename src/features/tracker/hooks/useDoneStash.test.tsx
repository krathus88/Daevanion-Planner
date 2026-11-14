import { act, renderHook } from "@testing-library/react"
import type { PointerEvent } from "react"
import { describe, expect, it } from "vitest"
import { useDoneStash } from "./useDoneStash"

const leave = (pointerType: string) => {
    return { pointerType: pointerType } as PointerEvent<HTMLDivElement>
}

const setup = () => {
    const card = document.createElement("div")

    document.body.append(card)

    return renderHook(() => {
        return useDoneStash({ current: card }, [])
    }).result
}

describe("useDoneStash", () => {
    it("keeps tasks edited until the mouse leaves the card", () => {
        const result = setup()

        act(() => {
            result.current.edit("arena-wins")
        })
        expect([...result.current.editing]).toEqual(["arena-wins"])

        // A touch fires a leave after every tap: it doesn't count.
        act(() => {
            result.current.onPointerLeave(leave("touch"))
        })
        expect([...result.current.editing]).toEqual(["arena-wins"])

        act(() => {
            result.current.onPointerLeave(leave("mouse"))
        })
        expect(result.current.editing.size).toBe(0)
    })

    it("lets go of them on a click outside the card", () => {
        const result = setup()

        act(() => {
            result.current.edit("arena-wins")
        })
        act(() => {
            document.body.click()
        })

        expect(result.current.editing.size).toBe(0)
    })
})
