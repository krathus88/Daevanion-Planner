import { defineSlotRecipe } from "@chakra-ui/react"
import { collapsibleAnatomy } from "@chakra-ui/react/anatomy"

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
