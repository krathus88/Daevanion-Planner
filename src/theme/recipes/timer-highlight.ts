import { defineRecipe } from "@chakra-ui/react"

// Tints use low opacity, not dark shades, so light hues don't turn brown.
export const timerHighlightRecipe = defineRecipe({
    base: {
        bg: "app.raised",
        borderWidth: "1px",
        transitionProperty: "common",
        transitionDuration: "moderate",
        _motionReduce: { animation: "none" },
    },
    variants: {
        state: {
            idle: {},
            soon: {},
            active: {},
        },
        tone: {
            strong: {},
            soft: {},
        },
        // Idle timers keep the plain border; only watched ones show colour.
        plain: {
            true: {},
        },
    },
    compoundVariants: [
        {
            state: "idle",
            tone: "strong",
            css: { borderColor: "colorPalette.500/40" },
        },
        {
            state: "soon",
            tone: "strong",
            css: {
                bg: "colorPalette.500/25",
                borderColor: "colorPalette.400",
                // So the palette is the timer's own, not the page's.
                "--timer-soon-glow":
                    "0 0 8px 0 var(--chakra-colors-color-palette-500)",
                boxShadow: "var(--timer-soon-glow)",
                animation: "timerFlashStrong",
            },
        },
        {
            state: "active",
            tone: "strong",
            css: {
                bg: "colorPalette.500/30",
                borderColor: "colorPalette.400",
                animation: "timerPulseStrong",
            },
        },
        {
            state: "idle",
            tone: "soft",
            css: { borderColor: "colorPalette.300/35" },
        },
        {
            state: "soon",
            tone: "soft",
            css: {
                bg: "colorPalette.300/20",
                borderColor: "colorPalette.200",
                "--timer-soon-glow":
                    "0 0 8px 0 var(--chakra-colors-color-palette-300)",
                boxShadow: "var(--timer-soon-glow)",
                animation: "timerFlashSoft",
            },
        },
        {
            state: "active",
            tone: "soft",
            css: {
                bg: "colorPalette.300/22",
                borderColor: "colorPalette.200",
                animation: "timerPulseSoft",
            },
        },
        {
            state: "idle",
            plain: true,
            css: { borderColor: "app.border" },
        },
    ],
    defaultVariants: {
        state: "idle",
        tone: "strong",
    },
})
