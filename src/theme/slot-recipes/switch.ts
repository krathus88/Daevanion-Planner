import { defineSlotRecipe } from "@chakra-ui/react"
import { switchAnatomy } from "@chakra-ui/react/anatomy"

// Colors go on Chakra's default "solid" variant, which would otherwise
// override them. The off track uses the strong border color so it stands
// out on cards; on is the accent.
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
