import { defineTextStyles } from "@chakra-ui/react"

export const textStyles = defineTextStyles({
    // Small uppercase heading above a group of controls.
    label: {
        value: {
            color: "app.subtle",
            fontSize: "xs",
            fontWeight: "semibold",
            letterSpacing: "wider",
            textTransform: "uppercase",
        },
    },
    // Helper text under or above controls.
    hint: {
        value: {
            color: "app.subtle",
            fontSize: "xs",
            lineHeight: "tall",
        },
    },
    caption: {
        value: {
            color: "app.subtle",
            fontSize: "xs",
        },
    },
    // The big number in a stat tile.
    stat: {
        value: {
            fontSize: "lg",
            fontWeight: "semibold",
            lineHeight: "short",
        },
    },
})
