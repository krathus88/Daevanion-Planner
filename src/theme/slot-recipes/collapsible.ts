import { defineSlotRecipe } from "@chakra-ui/react"
import { collapsibleAnatomy } from "@chakra-ui/react/anatomy"

// Adds four looks to Chakra's collapsible: "card" is a bordered section,
// "featured" is a card with an accent edge, "sub" is a lighter uppercase
// heading nested inside one, and "nested" is a slightly darker box inside a
// "sub".
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
            // A card with an accent edge, for a section worth noticing.
            featured: {
                root: {
                    layerStyle: "card",
                    borderLeftWidth: "3px",
                    borderLeftColor: "app.accent",
                },
                trigger: {
                    color: "app.accent",
                    fontSize: "sm",
                    px: "4",
                    py: "3",
                },
                indicator: {
                    color: "app.accent",
                },
                content: {
                    px: "4",
                    pb: "4",
                },
            },
            // A slightly darker box inside a "sub" section, for its advanced
            // options.
            nested: {
                root: {
                    bg: "app.panel",
                    borderRadius: "md",
                },
                trigger: {
                    color: "app.muted",
                    fontSize: "xs",
                    px: "3",
                    py: "2",
                    _hover: { color: "app.fg" },
                },
                content: {
                    px: "3",
                    pt: "2",
                    pb: "3",
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
