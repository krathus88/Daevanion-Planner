import { useEffect, useRef, type RefObject } from "react"

// Keeps the selected row (aria-pressed) in view in its scrolling list: on
// mount (a page load with an item open) it goes to the middle; when the
// selection changes later (e.g. a Crafted from link) it's brought to the
// middle only if it's out of view. Never moves the page or takes focus.
export const useScrollToSelected = (
    listRef: RefObject<HTMLElement | null>,
    selectedId: number | undefined,
) => {
    const mounted = useRef(false)

    useEffect(() => {
        const list = listRef.current
        const row = list?.querySelector<HTMLElement>('[aria-pressed="true"]')
        const first = !mounted.current

        mounted.current = true

        if (!list || !row) {
            return
        }

        const listBox = list.getBoundingClientRect()
        const rowBox = row.getBoundingClientRect()
        const visible =
            rowBox.top >= listBox.top && rowBox.bottom <= listBox.bottom

        if (first || !visible) {
            list.scrollTop +=
                rowBox.top -
                listBox.top -
                (list.clientHeight - rowBox.height) / 2
        }
    }, [listRef, selectedId])
}
