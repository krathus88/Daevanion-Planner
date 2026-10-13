import { defineSlotRecipe } from "@chakra-ui/react"
import { segmentGroupAnatomy } from "@chakra-ui/react/anatomy"

// A recessed track with a raised, ring-outlined thumb on the chosen item.
export const segmentGroupSlotRecipe = defineSlotRecipe({
    slots: segmentGroupAnatomy.keys(),
    base: {
        root: {
            "--segment-indicator-bg": "colors.app.raised",
            "--segment-indicator-shadow": "shadows.insetRing",
            bg: "app.inset",
            borderColor: "app.border",
            borderWidth: "1px",
            boxShadow: "none",
        },
        item: {
            h: "auto",
            color: "app.muted",
            cursor: "button",
            fontWeight: "medium",
            _hover: { color: "app.fg" },
            _checked: {
                color: "app.fg",
                fontWeight: "semibold",
            },
            // Chakra draws dividers between items; the thumb is enough here.
            _before: { display: "none" },
        },
    },
    variants: {
        layout: {
            // Items share the full width (the Planner/Manual toggle).
            fill: {
                root: {
                    "--segment-radius": "radii.md",
                    display: "flex",
                    w: "full",
                    p: "1",
                    borderRadius: "lg",
                },
                item: {
                    flex: "1",
                    fontSize: "sm",
                    py: "1.5",
                },
            },
            // Small, tight items (the stat tier picker).
            compact: {
                root: {
                    "--segment-radius": "radii.sm",
                    p: "0.5",
                    borderRadius: "md",
                },
                item: {
                    fontSize: "xs",
                    px: "2",
                    py: "0.5",
                },
            },
        },
    },
})
