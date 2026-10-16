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
        // A drop zone.
        dashed: { value: "dashed" },
    },
    cursor: {
        // A drag handle.
        grab: { value: "grab" },
        // Shown but not clickable, e.g. a shared plan's nodes.
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
    // strictTokens only accepts token values, and Chakra's defaults have no
    // tokens for these everyday values. Naming them after their value keeps
    // props readable, e.g. borderWidth="1px", m="0".
    borderWidths: {
        0: { value: "0" },
        "1px": { value: "1px" },
        "2px": { value: "2px" },
        "3px": { value: "3px" },
    },
    spacing: {
        0: { value: "0" },
        auto: { value: "auto" },
        // Overlapping a 1px border, e.g. a tab sitting on its panel.
        "1px": { value: "1px" },
        // Below the sticky header (4rem) with a little room.
        headerOffset: { value: "5.5rem" },
        board: {
            markerInset: { value: "0.1rem" },
            // The rings of a special node's gem, from the edge inwards.
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
