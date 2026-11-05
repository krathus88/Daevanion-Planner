import { defineLayerStyles } from "@chakra-ui/react"

export const layerStyles = defineLayerStyles({
    card: {
        value: {
            bg: "app.raised",
            borderColor: "app.border",
            borderRadius: "lg",
            borderWidth: "1px",
        },
    },
    inset: {
        value: {
            bg: "app.inset",
            borderColor: "app.border",
            borderWidth: "1px",
        },
    },
    listItem: {
        value: {
            bg: "app.raised",
            borderColor: "app.border",
            borderRadius: "md",
            borderWidth: "1px",
        },
    },
    // A box things are dragged into; lighter than the panel around it and
    // the inputs inside it.
    dropZone: {
        value: {
            bg: "app.hover",
            borderColor: "app.borderStrong",
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
    alert: {
        value: {
            bg: "app.dangerMuted",
            borderColor: "app.dangerBorder",
            borderRadius: "md",
            borderWidth: "1px",
        },
    },
    notice: {
        value: {
            bg: "app.accentMuted",
            borderColor: "app.accent",
            borderRadius: "md",
            borderWidth: "1px",
        },
    },
})
