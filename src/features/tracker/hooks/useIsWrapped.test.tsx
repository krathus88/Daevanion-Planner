import { act, render, screen } from "@testing-library/react"
import { useRef } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useIsWrapped } from "./useIsWrapped"

// jsdom has no layout or ResizeObserver: tops are set by hand and the
// observer is called on demand.
let notify = () => {}

class FakeResizeObserver {
    constructor(callback: () => void) {
        notify = callback
    }

    observe() {}

    disconnect() {}
}

const setTop = (element: Element, top: number) => {
    Object.defineProperty(element, "offsetTop", {
        configurable: true,
        value: top,
    })
}

const Row = () => {
    const ref = useRef<HTMLDivElement>(null)
    const wrapped = useIsWrapped(ref)

    return (
        <div>
            <div data-testid="first" />
            <div ref={ref} data-testid="item">
                {wrapped ? "wrapped" : "inline"}
            </div>
        </div>
    )
}

describe("useIsWrapped", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("follows the item onto a line of its own and back", () => {
        vi.stubGlobal("ResizeObserver", FakeResizeObserver)
        render(<Row />)

        const first = screen.getByTestId("first")
        const item = screen.getByTestId("item")

        expect(item).toHaveTextContent("inline")

        setTop(first, 0)
        setTop(item, 30)
        act(() => {
            notify()
        })
        expect(item).toHaveTextContent("wrapped")

        setTop(item, 0)
        act(() => {
            notify()
        })
        expect(item).toHaveTextContent("inline")
    })
})
