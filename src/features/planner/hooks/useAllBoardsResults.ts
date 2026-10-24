import { useRef, useState } from "react"
import type { SidebarTab } from "../types"

// Results wait for the All boards tab so a finished run doesn't replace the
// board you're on.
export const useAllBoardsResults = (
    tab: SidebarTab,
    changeSidebarTab: (tab: SidebarTab) => void,
) => {
    const [hasUnseenResults, setHasUnseenResults] = useState(false)
    const [isCompareOpen, setIsCompareOpen] = useState(false)
    const pendingResults = useRef<(() => void) | null>(null)
    // A ref: the completion callback is created when the run starts.
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
