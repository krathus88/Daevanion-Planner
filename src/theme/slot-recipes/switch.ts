import { defineSlotRecipe } from "@chakra-ui/react"
import { switchAnatomy } from "@chakra-ui/react/anatomy"

// Colours go on Chakra's "solid" variant, which would otherwise override them.
export const switchSlotRecipe = defineSlotRecipe({
    slots: switchAnatomy.keys(),
    base: {
        label: {
            fontSize: "sm",
        },
    },
    variants: {
        variant: {
            solid: {
                control: {
                    bg: "app.borderStrong",
                    _hover: { bg: "app.subtle" },
                    _checked: {
                        bg: "app.accent",
                        _hover: { bg: "app.accentHover" },
                    },
                },
                thumb: {
                    bg: "app.fg",
                    _checked: { bg: "app.accentFg" },
                },
            },
        },
    },
})
