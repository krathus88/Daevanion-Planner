import { defineSlotRecipe } from "@chakra-ui/react"
import { progressAnatomy } from "@chakra-ui/react/anatomy"

export const progressSlotRecipe = defineSlotRecipe({
    slots: progressAnatomy.keys(),
    base: {
        track: {
            bg: "app.inset",
            borderRadius: "full",
        },
        range: {
            bg: "app.accent",
        },
    },
})
