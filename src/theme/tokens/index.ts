import { defineTokens } from "@chakra-ui/react"
import { colors } from "./colors"
import { gradients } from "./gradients"
import { shadows } from "./shadows"
import { sizes } from "./sizes"

export const tokens = defineTokens({
    colors: colors,
    gradients: gradients,
    shadows: shadows,
    sizes: sizes,
    opacity: {
        disabled: { value: 0.4 },
        hidden: { value: 0 },
        visible: { value: 1 },
    },
    borderStyles: {
        dashed: { value: "dashed" },
    },
    cursor: {
        grab: { value: "grab" },
        static: { value: "default" },
    },
    animations: {
        glowPulse: { value: "pulse 1.4s ease-in-out infinite" },
        timerPulseStrong: {
            value: "timerPulseStrong 2s ease-in-out infinite",
        },
        timerPulseSoft: { value: "timerPulseSoft 2s ease-in-out infinite" },
        timerFlashStrong: {
            value: "timerFlashStrong 2s ease-in-out infinite",
        },
        timerFlashSoft: { value: "timerFlashSoft 2s ease-in-out infinite" },
        none: { value: "none" },
    },
    lineHeights: {
        tight: { value: 1.15 },
        normal: { value: "normal" },
    },
    radii: {
        boardFrame: { value: "10px" },
    },
    // strictTokens only accepts tokens, and Chakra has none for these values.
    borderWidths: {
        0: { value: "0" },
        "1px": { value: "1px" },
        "2px": { value: "2px" },
        "3px": { value: "3px" },
    },
    spacing: {
        0: { value: "0" },
        auto: { value: "auto" },
        "1px": { value: "1px" },
        // Below the 4rem sticky header.
        headerOffset: { value: "5.5rem" },
        board: {
            markerInset: { value: "0.1rem" },
            gemRing: { value: "22%" },
            gemFacet: { value: "calc(22% + 2px)" },
            gemCore: { value: "39%" },
        },
    },
    // Stacking inside a board cell, back to front.
    zIndex: {
        board: {
            edge: { value: 0 },
            node: { value: 1 },
            face: { value: 2 },
            label: { value: 3 },
            marker: { value: 4 },
        },
    },
})
