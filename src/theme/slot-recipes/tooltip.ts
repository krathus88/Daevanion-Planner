import { defineSlotRecipe } from "@chakra-ui/react"
import { tooltipAnatomy } from "@chakra-ui/react/anatomy"

export const tooltipSlotRecipe = defineSlotRecipe({
    slots: tooltipAnatomy.keys(),
    base: {
        content: {
            "--tooltip-bg": "colors.app.raised",
            bg: "app.raised",
            borderColor: "app.borderStrong",
            borderWidth: "1px",
            color: "app.fg",
            fontSize: "xs",
            maxW: "xs",
        },
    },
})
