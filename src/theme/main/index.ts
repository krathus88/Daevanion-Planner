import { defineConfig } from "@chakra-ui/react"

export const config = defineConfig({
    strictTokens: false,
    globalCss: {
        body: {
            bg: "app.bg",
            color: "app.fg",
        },
    },
    theme: {
        semanticTokens: {
            colors: {
                bg: {
                    value: {
                        _light: "#edeef1",
                        _dark: "#1c1c1f",
                    },
                },
                "bg.surface": {
                    value: {
                        _light: "#ffffff",
                        _dark: "#31313c",
                    },
                },
                "bg.surfaceSubtle": {
                    value: {
                        _light: "#f7f7f9",
                        _dark: "#282830",
                    },
                },
                // The planner is a dark-only UI. Surfaces step up in
                // lightness so panels, cards and inputs read as distinct layers.
                app: {
                    bg: { value: "#0a0c11" },
                    panel: { value: "#141821" },
                    raised: { value: "#1c2230" },
                    hover: { value: "#252c3c" },
                    inset: { value: "#0e1117" },
                    border: { value: "#262d3c" },
                    borderStrong: { value: "#38425a" },
                    fg: { value: "#e9ebf1" },
                    muted: { value: "#9ba3b4" },
                    subtle: { value: "#6b7385" },
                    accent: { value: "#e0ad4c" },
                    accentHover: { value: "#f0c46a" },
                    accentFg: { value: "#14110a" },
                    accentMuted: { value: "rgba(224, 173, 76, 0.14)" },
                    success: { value: "#5fd39a" },
                    danger: { value: "#f2777a" },
                    dangerMuted: { value: "rgba(242, 119, 122, 0.12)" },
                    dangerStrong: { value: "rgba(242, 119, 122, 0.24)" },
                    dangerBorder: { value: "rgba(242, 119, 122, 0.45)" },
                    info: { value: "#86aefc" },
                    infoMuted: { value: "rgba(134, 174, 252, 0.12)" },
                    infoStrong: { value: "rgba(134, 174, 252, 0.24)" },
                    infoBorder: { value: "rgba(134, 174, 252, 0.45)" },
                },
            },
        },
    },
})
