import { defineSlotRecipe } from "@chakra-ui/react"
import { switchAnatomy } from "@chakra-ui/react/anatomy"

export const switchSlotRecipe = defineSlotRecipe({
    slots: switchAnatomy.keys(),
    base: {
        control: {
            bg: "app.hover",
            _checked: { bg: "app.accent" },
        },
        label: {
            fontSize: "sm",
        },
    },
})
