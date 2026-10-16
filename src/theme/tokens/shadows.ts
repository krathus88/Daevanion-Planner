import { defineTokens } from "@chakra-ui/react"

const NODE_HOVER_GLOW = "0 0 10px rgba(255, 255, 255, 0.45)"
const NODE_SELECTED =
    "0 0 0 2px rgba(37, 99, 235, 0.55), 0 0 14px rgba(37, 99, 235, 0.6)"
const NODE_ADJACENT = "0 0 10px 2px rgba(45, 212, 191, 0.55)"

export const shadows = defineTokens.shadows({
    none: { value: "none" },
    // A 1px inset ring, used for the selected segment of a toggle.
    insetRing: { value: "inset 0 0 0 1px {colors.app.borderStrong}" },
    accent: {
        glow: { value: "0 0 10px rgba(224, 173, 76, 0.75)" },
        dot: { value: "0 0 8px 2px rgba(224, 173, 76, 0.7)" },
    },
    board: {
        edge: { value: "0 0 7px rgba(255, 204, 102, 0.28)" },
        start: {
            value: "0 0 0 1px rgba(255, 226, 160, 0.55), 0 0 18px 4px rgba(217, 179, 108, 0.45)",
        },
        target: { value: "0 0 6px rgba(250, 204, 21, 0.8)" },
        need: { value: "0 0 6px rgba(134, 174, 252, 0.8)" },
        gem: { value: "0 0 6px rgba(255, 244, 209, 0.9)" },
        node: {
            selected: { value: NODE_SELECTED },
            selectedAbility: {
                value: "0 0 0 3px rgba(250, 204, 21, 0.9), 0 0 14px rgba(250, 204, 21, 0.45)",
            },
            adjacent: { value: NODE_ADJACENT },
            // Stat nodes light up on hover, on top of their state's shadow.
            hover: { value: NODE_HOVER_GLOW },
            selectedHover: { value: `${NODE_SELECTED}, ${NODE_HOVER_GLOW}` },
            adjacentHover: { value: `${NODE_ADJACENT}, ${NODE_HOVER_GLOW}` },
        },
    },
})
