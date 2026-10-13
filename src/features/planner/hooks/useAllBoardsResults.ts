import { useRef, useState } from "react"
import type { SidebarTab } from "../types"

// "Optimize all boards" results wait until the All boards tab is open: a
// finished run doesn't replace the board you're looking at. Until then the
// tab glows.
export const useAllBoardsResults = (
    tab: SidebarTab,
    changeSidebarTab: (tab: SidebarTab) => void,
) => {
    const [hasUnseenResults, setHasUnseenResults] = useState(false)
    const [isCompareOpen, setIsCompareOpen] = useState(false)
    const pendingResults = useRef<(() => void) | null>(null)
    // The optimizer's completion callback is created when the run starts, so
    // it reads the live tab from a ref rather than a stale render value.
    const tabRef = useRef(tab)

    const changeTab = (nextTab: SidebarTab) => {
        if (nextTab === "all-boards") {
            const applyResults = pendingResults.current
            pendingResults.current = null
            applyResults?.()
            setIsCompareOpen(applyResults !== null)
            setHasUnseenResults(false)
        }

        tabRef.current = nextTab
        changeSidebarTab(nextTab)
    }

    const handleOptimizeAllComplete = (applyResults: () => void) => {
        if (tabRef.current === "all-boards") {
            applyResults()
            setIsCompareOpen(true)
            return
        }

        pendingResults.current = applyResults
        setHasUnseenResults(true)
    }

    return {
        hasUnseenResults: hasUnseenResults,
        isCompareOpen: isCompareOpen,
        setIsCompareOpen: setIsCompareOpen,
        changeTab: changeTab,
        handleOptimizeAllComplete: handleOptimizeAllComplete,
    }
}
