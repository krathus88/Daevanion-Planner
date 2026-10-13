import { defineSlotRecipe } from "@chakra-ui/react"
import { fieldAnatomy } from "@chakra-ui/react/anatomy"

export const fieldSlotRecipe = defineSlotRecipe({
    slots: fieldAnatomy.keys(),
    base: {
        label: {
            color: "app.muted",
            fontWeight: "normal",
        },
    },
    variants: {
        orientation: {
            // The label takes its own width instead of a fixed column.
            horizontal: {
                label: {
                    flex: "0 0 auto",
                },
            },
        },
    },
})
