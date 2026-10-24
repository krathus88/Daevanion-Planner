import type { SystemConfig } from "@chakra-ui/react"

export const utilities = {
    transitionProperty: {
        values: {
            common: "background-color, border-color, color, fill, stroke, opacity, box-shadow, translate, transform",
            colors: "background-color, border-color, color, fill, stroke",
            size: "width, height",
            position: "left, right, top, bottom, inset-inline, inset-block",
            background:
                "background, background-color, background-image, background-position",
            zoom: "transform, filter",
            transform: "transform",
            shape: "background, box-shadow",
            none: "none",
        },
    },
} satisfies SystemConfig["utilities"]
