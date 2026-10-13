import { defineGlobalStyles } from "@chakra-ui/react"

export const globalCss = defineGlobalStyles({
    html: {
        colorScheme: "dark",
    },
    body: {
        bg: "app.bg",
        color: "app.fg",
    },
})
