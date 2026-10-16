import { defineRecipe } from "@chakra-ui/react"

// How loudly a timer shows, in its own colour palette. Quiet when idle, so the
// "soon" and "active" states stand out instead of blending in.
// Tints are the colour at low opacity rather than a dark shade, which keeps
// light hues like yellow from turning brown on the dark background. "strong"
// uses the hue's mid shade, "soft" a pastel of it.
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
            // About to start: a gently flashing border, a tint and a steady
            // glow.
            soon: {},
            // Open now: brighter fill, a slow pulsing glow and a flashing
            // border.
            active: {},
        },
        tone: {
            strong: {},
            soft: {},
        },
        // Leaves an idle timer in the plain border, e.g. an unpinned field
        // boss, so only the ones being watched show their colour.
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
                // Set here, so the palette is the timer's own, not the page's.
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
