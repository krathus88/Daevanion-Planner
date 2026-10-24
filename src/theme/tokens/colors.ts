import { defineTokens } from "@chakra-ui/react"

// Raw palette; components use the semantic tokens.
export const colors = defineTokens.colors({
    ink: {
        950: { value: "#0a0c11" },
        900: { value: "#0e1117" },
        850: { value: "#141821" },
        800: { value: "#1c2230" },
        750: { value: "#252c3c" },
        700: { value: "#262d3c" },
        600: { value: "#38425a" },
        500: { value: "#6b7385" },
        400: { value: "#9ba3b4" },
        50: { value: "#e9ebf1" },
    },
    gold: {
        300: { value: "#f0c46a" },
        400: { value: "#efc05b" },
        500: { value: "#e0ad4c" },
        600: { value: "#d9a441" },
        950: { value: "#2a1d06" },
        975: { value: "#14110a" },
    },
    bronze: {
        400: { value: "#e8913f" },
        500: { value: "#8f5d2c" },
    },
    mint: {
        400: { value: "#5fd39a" },
    },
    coral: {
        400: { value: "#f2777a" },
    },
    periwinkle: {
        400: { value: "#86aefc" },
    },
})
