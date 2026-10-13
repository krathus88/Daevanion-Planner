import { defineTokens } from "@chakra-ui/react"

export const sizes = defineTokens.sizes({
    0: { value: "0" },
    auto: { value: "auto" },
    "1px": { value: "1px" },
    sidebar: { value: "26rem" },
    // Fits the sidebar beside the board without a sticky scroll.
    sidebarMaxH: { value: "calc(100vh - 7rem)" },
    board: { value: "880px" },
    searchTimeSelect: { value: "5.5rem" },
    plannedColumn: { value: "2.875rem" },
    // Node shapes inside a 3.5rem board cell.
    node: {
        stat: { value: "1.875rem" },
        start: { value: "3.25rem" },
        special: { value: "3.75rem" },
        // Inside the special node's border ring.
        specialFace: { value: "calc(100% - 6px)" },
    },
})
