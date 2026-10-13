import { defineRecipe } from "@chakra-ui/react"

const dimmedWhenDisabled = {
    _disabled: {
        cursor: "disabled",
        opacity: "disabled",
    },
} as const

// Adds the app's button variants on top of Chakra's button recipe.
// info = undo, danger = clear/reset, so an action's kind is clear at a glance.
export const buttonRecipe = defineRecipe({
    variants: {
        variant: {
            primary: {
                ...dimmedWhenDisabled,
                bg: "app.accent",
                color: "app.accentFg",
                fontWeight: "semibold",
                _hover: { bg: "app.accentHover" },
            },
            secondary: {
                ...dimmedWhenDisabled,
                bg: "app.raised",
                borderColor: "app.borderStrong",
                borderWidth: "1px",
                color: "app.fg",
                _hover: { bg: "app.hover" },
            },
            info: {
                ...dimmedWhenDisabled,
                bg: "app.infoMuted",
                borderColor: "app.infoBorder",
                borderWidth: "1px",
                color: "app.info",
                fontWeight: "medium",
                _hover: { bg: "app.infoStrong" },
            },
            danger: {
                ...dimmedWhenDisabled,
                bg: "app.dangerMuted",
                borderColor: "app.dangerBorder",
                borderWidth: "1px",
                color: "app.danger",
                fontWeight: "medium",
                _hover: { bg: "app.dangerStrong" },
            },
            ghost: {
                bg: "transparent",
                color: "app.muted",
                _hover: { bg: "app.hover", color: "app.fg" },
            },
            dangerGhost: {
                bg: "transparent",
                color: "app.danger",
                _hover: { bg: "app.dangerMuted" },
            },
        },
    },
})
