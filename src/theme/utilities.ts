import type { SystemConfig } from "@chakra-ui/react"

// Extra named values for style props that don't read from a token scale.
export const utilities = {
    transitionProperty: {
        values: {
            common: "background-color, border-color, color, fill, stroke, opacity, box-shadow, translate, transform",
            colors: "background-color, border-color, color, fill, stroke",
            size: "width, height",
            position: "left, right, top, bottom, inset-inline, inset-block",
            background:
                "background, background-color, background-image, background-position",
            // Artwork zooming and brightening on hover.
            zoom: "transform, filter",
            // A node's fill and glow changing with its state.
            shape: "background, box-shadow",
            none: "none",
        },
    },
} satisfies SystemConfig["utilities"]
