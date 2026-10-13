import { defineSlotRecipe } from "@chakra-ui/react"
import { selectAnatomy } from "@chakra-ui/react/anatomy"

export const selectSlotRecipe = defineSlotRecipe({
    slots: selectAnatomy.keys(),
    base: {
        label: {
            color: "app.muted",
            fontWeight: "normal",
            whiteSpace: "nowrap",
        },
        content: {
            bg: "app.raised",
            borderColor: "app.borderStrong",
            borderWidth: "1px",
        },
        item: {
            color: "app.fg",
            cursor: "button",
            _highlighted: { bg: "app.hover" },
        },
        indicator: {
            color: "app.muted",
        },
        itemIndicator: {
            color: "app.accent",
        },
    },
    variants: {
        variant: {
            outline: {
                trigger: {
                    bg: "app.raised",
                    borderColor: "app.borderStrong",
                    color: "app.fg",
                    cursor: "button",
                    focusRingColor: "app.accent",
                    _focusVisible: { borderColor: "app.accent" },
                },
            },
        },
    },
})
