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
    petList: { value: "22rem" },
    petMap: { value: "max(28rem, calc(100vh - 22rem))" },
    // Inside a Card (1rem padding, 1px border), the width from the card's inner
    // edge to the right edge of the first CardGrid column (1rem gaps): 100% there
    // is the page width less 2rem + 2px, and the card's inset (1rem + 1px) comes
    // off the column. A 1rem gap after it then lines up with the columns' gap.
    cardColumn: {
        half: { value: "calc((100% + 1rem + 2px) / 2 - 1rem - 1px)" },
        third: { value: "calc((100% + 2px) / 3 - 1rem - 1px)" },
    },
    // A tracker box two task tiles wide: 2 x 17rem tiles, a 0.5rem gap, 0.5rem
    // padding each side and a 1px border (at most the full width, for phones).
    twoTileBox: { value: "min(100%, calc(35.5rem + 2px))" },
    node: {
        stat: { value: "1.875rem" },
        statPassive: { value: "2.25rem" },
        statSkill: { value: "2.625rem" },
        start: { value: "3.25rem" },
        special: { value: "3.75rem" },
        specialFace: { value: "calc(100% - 6px)" },
    },
})
