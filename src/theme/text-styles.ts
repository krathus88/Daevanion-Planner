import { defineTextStyles } from "@chakra-ui/react"

export const textStyles = defineTextStyles({
    label: {
        value: {
            color: "app.subtle",
            fontSize: "xs",
            fontWeight: "semibold",
            letterSpacing: "wider",
            textTransform: "uppercase",
        },
    },
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
    stat: {
        value: {
            fontSize: "lg",
            fontWeight: "semibold",
            lineHeight: "short",
        },
    },
})
