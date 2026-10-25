import { defineTokens } from "@chakra-ui/react"

export const sizes = defineTokens.sizes({
    0: { value: "0" },
    auto: { value: "auto" },
    "1px": { value: "1px" },
    sidebar: { value: "26rem" },
    sidebarMaxH: { value: "calc(100vh - 7rem)" },
    board: { value: "880px" },
    searchTimeSelect: { value: "5.5rem" },
    serverSelect: { value: "11rem" },
    plannedColumn: { value: "1.5rem" },
    node: {
        stat: { value: "1.875rem" },
        statPassive: { value: "2.25rem" },
        statSkill: { value: "2.625rem" },
        start: { value: "3.25rem" },
        special: { value: "3.75rem" },
        specialFace: { value: "calc(100% - 6px)" },
    },
})
