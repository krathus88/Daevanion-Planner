import { fireEvent, render, screen } from "@testing-library/react"
import { useRef, useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useSlideIntoPlace } from "./useSlideIntoPlace"

type Layout = Record<string, { x: number; y: number; w: number; h: number }>

// jsdom has no layout: each element reports the box `layout` gives its id.
let layout: Layout = {}

const boxOf = (element: Element) => {
    const id = (element as HTMLElement).dataset.slideId ?? "container"
    const box = layout[id] ?? { x: 0, y: 0, w: 0, h: 0 }

    // "next" sits under the box, so it follows the box's height.
    if (id === "next") {
        const above = document.querySelector<HTMLElement>(
            '[data-slide-id="box"]',
        )
        const height = above?.style.height
            ? parseFloat(above.style.height)
            : layout.box.h

        return {
            left: 0,
            top: layout.box.y + height,
            width: 100,
            height: 20,
        } as DOMRect
    }

    return {
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
    } as DOMRect
}

const animate = vi.fn()

const Harness = () => {
    const ref = useRef<HTMLDivElement>(null)
    const [ids, setIds] = useState(["a", "b"])
    const capture = useSlideIntoPlace(ref)

    const [extraBox, setExtraBox] = useState(false)

    const handleRemove = () => {
        setIds(ids.slice(1))
    }

    const handleAdd = () => {
        setIds([...ids, "c"])
    }

    const handleAddBox = () => {
        setExtraBox(true)
    }

    return (
        <>
            <button onClick={capture}>Capture</button>
            <button onClick={handleRemove}>Remove</button>
            <button onClick={handleAdd}>Add</button>
            <button onClick={handleAddBox}>Add box</button>

            <div ref={ref}>
                <div data-slide-id="box">
                    {ids.map((id) => (
                        <div key={id} data-slide-id={id} />
                    ))}
                </div>
                <div data-slide-id="next" />
                <div data-slide-id="section" data-slide-section />

                {extraBox && (
                    <div data-slide-id="box2">
                        <div data-slide-id="d" />
                    </div>
                )}
            </div>
        </>
    )
}

// Each animate call on a slide element, by its id (the container's own
// overflow clip left out).
const slides = () =>
    animate.mock.calls.flatMap(([keyframes], index) => {
        const id = (animate.mock.contexts[index] as HTMLElement).dataset.slideId

        return id ? [{ id: id, keyframes: keyframes }] : []
    })

const click = (name: string) => {
    fireEvent.click(screen.getByRole("button", { name: name }))
}

describe("useSlideIntoPlace", () => {
    afterEach(() => {
        vi.restoreAllMocks()
        animate.mockReset()
    })

    it("slides what stays from where it was, relative to its box", () => {
        vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
            function (this: Element) {
                return boxOf(this)
            },
        )
        HTMLElement.prototype.animate = animate

        render(<Harness />)

        layout = {
            container: { x: 0, y: 0, w: 100, h: 100 },
            box: { x: 0, y: 10, w: 100, h: 80 },
            a: { x: 0, y: 20, w: 100, h: 30 },
            b: { x: 0, y: 50, w: 100, h: 30 },
        }
        click("Capture")

        layout = {
            container: { x: 0, y: 0, w: 100, h: 60 },
            box: { x: 0, y: 10, w: 100, h: 50 },
            b: { x: 0, y: 20, w: 100, h: 30 },
        }
        click("Remove")

        const calls = slides().map((slide) => slide.keyframes)

        expect(calls).toEqual(
            expect.arrayContaining([
                // The box stays put but eases its height.
                [
                    {
                        transform: "translate(0px, 0px)",
                        height: "80px",
                        overflow: "clip",
                    },
                    { transform: "none", height: "50px", overflow: "clip" },
                ],
                // b moves up 30px inside the box.
                [{ transform: "translate(0px, 30px)" }, { transform: "none" }],
            ]),
        )
        // "next" and the section move with the box's eased height alone,
        // no slide on top.
        expect(calls).toHaveLength(2)
    })

    it("snaps sizes and only slides when a section changes size", () => {
        vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
            function (this: Element) {
                return boxOf(this)
            },
        )
        HTMLElement.prototype.animate = animate

        render(<Harness />)

        layout = {
            container: { x: 0, y: 0, w: 100, h: 200 },
            box: { x: 0, y: 10, w: 100, h: 80 },
            a: { x: 0, y: 20, w: 100, h: 30 },
            b: { x: 0, y: 50, w: 100, h: 30 },
            section: { x: 0, y: 120, w: 100, h: 40 },
        }
        click("Capture")

        // The removed task went into the section, which grew.
        layout = {
            container: { x: 0, y: 0, w: 100, h: 200 },
            box: { x: 0, y: 10, w: 100, h: 50 },
            b: { x: 0, y: 20, w: 100, h: 30 },
            section: { x: 0, y: 90, w: 100, h: 70 },
        }
        click("Remove")

        expect(slides()).toEqual([
            // No eased height: the box clips what slides in from below.
            {
                id: "box",
                keyframes: [
                    { transform: "translate(0px, 0px)", overflow: "clip" },
                    { transform: "none", overflow: "clip" },
                ],
            },
            {
                id: "b",
                keyframes: [
                    { transform: "translate(0px, 30px)" },
                    { transform: "none" },
                ],
            },
            {
                id: "next",
                keyframes: [
                    { transform: "translate(0px, 30px)" },
                    { transform: "none" },
                ],
            },
            {
                id: "section",
                keyframes: [
                    { transform: "translate(0px, 30px)" },
                    { transform: "none" },
                ],
            },
        ])
    })

    it("does nothing on renders without a capture", () => {
        HTMLElement.prototype.animate = animate

        render(<Harness />)
        click("Remove")

        expect(animate).not.toHaveBeenCalled()
    })

    it("fades in what's new, a new box for its tiles too", () => {
        HTMLElement.prototype.animate = animate

        render(<Harness />)
        click("Capture")
        click("Add")
        click("Capture")
        click("Add box")

        const faded = slides()

        expect(faded.map((slide) => slide.id)).toEqual(["c", "box2"])
        expect(faded[0].keyframes).toEqual([
            { opacity: 0, transform: "scale(0.94)" },
            { opacity: 1, transform: "none" },
        ])
    })

    it("does nothing when the user prefers reduced motion", () => {
        HTMLElement.prototype.animate = animate
        vi.spyOn(window, "matchMedia").mockReturnValue({
            matches: true,
        } as MediaQueryList)

        render(<Harness />)
        click("Capture")
        click("Add")

        expect(animate).not.toHaveBeenCalled()
    })
})
