import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ComingNextPosition } from "@timers/logic/comingNextPosition"
import { useComingNextDrag } from "./useComingNextDrag"

type StripProps = {
    position: ComingNextPosition | null
    onDrop: (position: ComingNextPosition) => void
}

const Strip = ({ position, onDrop }: StripProps) => {
    const {
        anchorRef,
        stripRef,
        topLeft,
        isDragging,
        isDocked,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
    } = useComingNextDrag(position, onDrop)

    return (
        <header>
            <div ref={anchorRef} />

            <div
                ref={stripRef}
                data-testid="strip"
                data-docked={isDocked}
                data-dragging={isDragging}
                data-left={topLeft?.x}
                data-top={topLeft?.y}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            />
        </header>
    )
}

const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

beforeEach(() => {
    vi.stubGlobal(
        "ResizeObserver",
        class {
            observe() {}
            disconnect() {}
        },
    )
    Object.defineProperty(document.documentElement, "clientWidth", {
        configurable: true,
        value: WIDTH,
    })
    HTMLElement.prototype.setPointerCapture = vi.fn()
})

afterEach(() => {
    vi.unstubAllGlobals()
})

const setup = (position: ComingNextPosition | null = null) => {
    const onDrop = vi.fn()

    render(<Strip position={position} onDrop={onDrop} />)

    return { strip: screen.getByTestId("strip"), onDrop: onDrop }
}

describe("useComingNextDrag", () => {
    it("starts docked under the header", () => {
        const { strip } = setup()

        expect(strip).toHaveAttribute("data-docked", "true")
        expect(strip).toHaveAttribute("data-dragging", "false")
        expect(strip).toHaveAttribute("data-top", "0")
    })

    it("places a free strip from its saved fractions", () => {
        const { strip } = setup({ dock: "free", fx: 0.5, fy: 1 })

        expect(strip).toHaveAttribute("data-docked", "false")
        expect(strip).toHaveAttribute("data-left", String(WIDTH / 2))
        expect(strip).toHaveAttribute("data-top", String(HEIGHT))
    })

    it("follows the pointer and saves where it lands", () => {
        const { strip, onDrop } = setup()

        fireEvent.pointerDown(strip, { button: 0, clientX: 0, clientY: 0 })
        expect(strip).toHaveAttribute("data-dragging", "true")
        expect(strip).toHaveAttribute("data-docked", "false")

        fireEvent.pointerMove(strip, { clientX: 200, clientY: 300 })
        expect(strip).toHaveAttribute("data-left", "200")
        expect(strip).toHaveAttribute("data-top", "300")

        fireEvent.pointerUp(strip, { clientX: 200, clientY: 300 })

        expect(strip).toHaveAttribute("data-dragging", "false")
        expect(onDrop).toHaveBeenCalledWith({
            dock: "free",
            fx: 200 / WIDTH,
            fy: 300 / HEIGHT,
        })
    })

    it("ignores other mouse buttons", () => {
        const { strip, onDrop } = setup()

        fireEvent.pointerDown(strip, { button: 2 })
        expect(strip).toHaveAttribute("data-dragging", "false")

        fireEvent.pointerUp(strip, { clientX: 5, clientY: 5 })
        expect(onDrop).not.toHaveBeenCalled()
    })

    it("ignores moves without a drag", () => {
        const { strip } = setup()

        fireEvent.pointerMove(strip, { clientX: 200, clientY: 300 })

        expect(strip).toHaveAttribute("data-dragging", "false")
    })

    it("measures again when the window resizes", () => {
        const { strip } = setup({ dock: "free", fx: 1, fy: 0 })

        Object.defineProperty(document.documentElement, "clientWidth", {
            configurable: true,
            value: 500,
        })
        fireEvent(window, new Event("resize"))

        expect(strip).toHaveAttribute("data-left", "500")
    })
})
