import { useLayoutEffect, useRef, type RefObject } from "react"

const SLIDE_MS = 200

// A capture older than this belongs to a change that never re-rendered.
const CAPTURE_TTL_MS = 500

export const prefersReducedMotion = () =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

// The reverse of the taskLeave animation (theme keyframes).
const ENTER_FRAMES: Keyframe[] = [
    { opacity: 0, transform: "scale(0.94)" },
    { opacity: 1, transform: "none" },
]

type Box = {
    x: number
    y: number
    width: number
    height: number
    // Marked `data-slide-section`: a part of the card that changes size
    // at once (a section's items appear and vanish instantly).
    section: boolean
}

type Measured = {
    element: HTMLElement
    box: Box
    // The `data-slide-id` element around this one, if any.
    parentId?: string
}

// Each `data-slide-id` element's box, relative to the closest one around it
// (or the container), so a tile's slide adds to its box's instead of
// doubling it.
const measure = (container: HTMLElement) => {
    const measured = new Map<string, Measured>()
    const elements = container.querySelectorAll<HTMLElement>("[data-slide-id]")

    for (const element of elements) {
        const parent =
            element.parentElement?.closest<HTMLElement>("[data-slide-id]")
        const rect = element.getBoundingClientRect()
        const origin = (parent ?? container).getBoundingClientRect()

        measured.set(element.dataset.slideId ?? "", {
            element: element,
            box: {
                x: rect.left - origin.left,
                y: rect.top - origin.top,
                width: rect.width,
                height: rect.height,
                section: element.hasAttribute("data-slide-section"),
            },
            parentId: parent?.dataset.slideId,
        })
    }

    return measured
}

// Whether every section kept its place in the list and its height.
const sectionsSteady = (
    before: Map<string, Box>,
    after: Map<string, Measured>,
) => {
    const ids = (boxes: Iterable<[string, Box]>) =>
        [...boxes].filter(([, box]) => box.section).map(([id]) => id)
    const afterBoxes = [...after].map(
        ([id, { box }]) => [id, box] as [string, Box],
    )
    const beforeIds = ids(before)
    const afterIds = ids(afterBoxes)

    return (
        beforeIds.length === afterIds.length &&
        afterIds.every(
            (id) => before.get(id)?.height === after.get(id)?.box.height,
        )
    )
}

// Slides what stays from where it was to where it lands, after a change that
// adds or removes items (a FLIP animation), and fades new items in. Call
// `capture` right before the change; the render it causes animates. Elements
// opt in with `data-slide-id`. When no section changed size, one that keeps
// its width also eases its height, so what's below follows smoothly. When a
// section did, easing would grow the card while the section shrinks it (or
// the reverse), so every size snaps at once, the space is reserved, and
// only positions slide; a box that shrank clips what slides in from below.
export const useSlideIntoPlace = (
    containerRef: RefObject<HTMLElement | null>,
) => {
    const before = useRef<{ boxes: Map<string, Box>; at: number } | null>(null)

    useLayoutEffect(() => {
        const container = containerRef.current
        const captured = before.current

        before.current = null

        if (
            !container ||
            !captured ||
            performance.now() - captured.at > CAPTURE_TTL_MS
        ) {
            return
        }

        const snapshot = captured.boxes

        const after = measure(container)
        const steady = sectionsSteady(snapshot, after)
        const resized = new Set<string>()

        for (const [id, { element, box }] of after) {
            const old = snapshot.get(id)

            if (
                steady &&
                old &&
                old.width === box.width &&
                old.height !== box.height
            ) {
                resized.add(id)
                element.style.height = `${old.height}px`
            }
        }

        // The eased heights move what follows them in the layout, so slides
        // start from where things sit while those heights are still the old
        // ones; the two then add up to the right path.
        const frozen = resized.size > 0 ? measure(container) : after

        for (const id of resized) {
            const element = after.get(id)?.element

            if (element) {
                element.style.height = ""
            }
        }

        // What slides in from outside stays inside the container.
        container.animate?.([{ overflow: "clip" }, { overflow: "clip" }], {
            duration: SLIDE_MS,
        })

        for (const [id, { element, box, parentId }] of after) {
            if (typeof element.animate !== "function") {
                continue
            }

            const old = snapshot.get(id)

            if (!old) {
                // Inside a new box, the box fades in for both.
                if (!parentId || snapshot.has(parentId)) {
                    element.animate(ENTER_FRAMES, {
                        duration: SLIDE_MS,
                        easing: "ease-out",
                    })
                }

                continue
            }

            const start = frozen.get(id)?.box ?? box
            const dx = old.x - start.x
            const dy = old.y - start.y
            const isResized = resized.has(id)
            const isShrunk =
                !steady &&
                !box.section &&
                old.width === box.width &&
                box.height < old.height

            if (dx === 0 && dy === 0 && !isResized && !isShrunk) {
                continue
            }

            const from: Keyframe = { transform: `translate(${dx}px, ${dy}px)` }
            const to: Keyframe = { transform: "none" }

            if (isResized) {
                Object.assign(from, {
                    height: `${old.height}px`,
                    overflow: "clip",
                })
                Object.assign(to, {
                    height: `${box.height}px`,
                    overflow: "clip",
                })
            }

            if (isShrunk) {
                Object.assign(from, { overflow: "clip" })
                Object.assign(to, { overflow: "clip" })
            }

            element.animate([from, to], {
                duration: SLIDE_MS,
                easing: "ease-out",
            })
        }
    })

    return () => {
        const container = containerRef.current

        if (!container || prefersReducedMotion()) {
            return
        }

        before.current = {
            boxes: new Map(
                [...measure(container)].map(([id, { box }]) => [id, box]),
            ),
            at: performance.now(),
        }
    }
}
