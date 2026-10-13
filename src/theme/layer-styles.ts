import { defineLayerStyles } from "@chakra-ui/react"

export const layerStyles = defineLayerStyles({
    // A raised, bordered box inside a panel.
    card: {
        value: {
            bg: "app.raised",
            borderColor: "app.border",
            borderRadius: "lg",
            borderWidth: "1px",
        },
    },
    // A recessed box, e.g. behind a toggle or a progress bar.
    inset: {
        value: {
            bg: "app.inset",
            borderColor: "app.border",
            borderWidth: "1px",
        },
    },
    // A row in a saved list; the active one is the entry on the board.
    listItem: {
        value: {
            bg: "app.raised",
            borderColor: "app.border",
            borderRadius: "md",
            borderWidth: "1px",
        },
    },
    listItemActive: {
        value: {
            bg: "app.accentMuted",
            borderColor: "app.accent",
            borderRadius: "md",
            borderWidth: "1px",
        },
    },
})
