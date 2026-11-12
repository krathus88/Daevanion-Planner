import { useLayoutEffect, useState, type RefObject } from "react"

// Whether an item of a wrapping flex row has dropped to a line below the
// row's first item.
export const useIsWrapped = (
    ref: RefObject<HTMLElement | null>,
    enabled = true,
) => {
    const [wrapped, setWrapped] = useState(false)

    useLayoutEffect(() => {
        const item = ref.current
        const row = item?.parentElement

        if (!enabled || !item || !row) {
            return
        }

        const measure = () => {
            const first = row.firstElementChild

            setWrapped(
                first instanceof HTMLElement && first !== item
                    ? item.offsetTop > first.offsetTop
                    : false,
            )
        }

        measure()

        // Missing in jsdom.
        if (typeof ResizeObserver === "undefined") {
            return
        }

        const observer = new ResizeObserver(measure)

        observer.observe(row)

        return () => {
            observer.disconnect()
        }
    }, [ref, enabled])

    return wrapped
}
