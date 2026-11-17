import type { CraftingWindow } from "@crafting/logic/recipeList"
import { useLayoutEffect, useRef, type RefObject } from "react"

// Each window's list keeps its own scroll position: switching back to a
// window puts its list where it was (the top the first time). Returns the
// list's scroll handler, which keeps the open window's position.
export const useWindowScroll = (
    listRef: RefObject<HTMLElement | null>,
    craftWindow: CraftingWindow,
) => {
    const positions = useRef<Partial<Record<CraftingWindow, number>>>({})
    const current = useRef(craftWindow)

    // Before paint, so the other window's position never shows.
    useLayoutEffect(() => {
        const list = listRef.current

        if (current.current === craftWindow || !list) {
            return
        }

        current.current = craftWindow
        list.scrollTop = positions.current[craftWindow] ?? 0
    }, [listRef, craftWindow])

    const handleScroll = () => {
        const list = listRef.current

        if (list) {
            positions.current[current.current] = list.scrollTop
        }
    }

    return handleScroll
}
