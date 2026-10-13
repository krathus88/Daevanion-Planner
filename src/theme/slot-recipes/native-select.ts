import { defineSlotRecipe } from "@chakra-ui/react"
import { nativeSelectAnatomy } from "@chakra-ui/react/anatomy"
import { fieldStyles } from "@theme/recipes/input"

export const nativeSelectSlotRecipe = defineSlotRecipe({
    slots: nativeSelectAnatomy.keys(),
    base: {
        field: {
            // The open list is drawn by the browser; match the raised surface.
            "& option": {
                bg: "app.raised",
                color: "app.fg",
            },
        },
    },
    variants: {
        variant: {
            outline: {
                field: fieldStyles,
            },
        },
    },
})
