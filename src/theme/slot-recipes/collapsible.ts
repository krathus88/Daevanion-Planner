import { defineSlotRecipe } from "@chakra-ui/react"
import { collapsibleAnatomy } from "@chakra-ui/react/anatomy"

// Adds two looks to Chakra's collapsible: "card" is a bordered section,
// "sub" is a lighter uppercase heading nested inside one.
export const collapsibleSlotRecipe = defineSlotRecipe({
    slots: collapsibleAnatomy.keys(),
    base: {
        trigger: {
            display: "flex",
            alignItems: "center",
            gap: "2",
            w: "full",
            cursor: "button",
            userSelect: "none",
            fontWeight: "semibold",
            textAlign: "start",
        },
        indicator: {
            display: "flex",
            color: "app.muted",
            transition: "transform",
            transitionDuration: "fast",
            _open: { transform: "rotate(90deg)" },
        },
    },
    variants: {
        variant: {
            card: {
                root: {
                    layerStyle: "card",
                },
                trigger: {
                    color: "app.fg",
                    fontSize: "sm",
                    px: "4",
                    py: "3",
                },
                content: {
                    px: "4",
                    pb: "4",
                },
            },
            sub: {
                trigger: {
                    textStyle: "label",
                    py: "1",
                    _hover: { color: "app.fg" },
                },
                content: {
                    pt: "1",
                    pb: "2",
                },
            },
        },
    },
})
