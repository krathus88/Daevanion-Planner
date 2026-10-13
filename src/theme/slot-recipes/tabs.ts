import { defineSlotRecipe } from "@chakra-ui/react"
import { tabsAnatomy } from "@chakra-ui/react/anatomy"

export const tabsSlotRecipe = defineSlotRecipe({
    slots: tabsAnatomy.keys(),
    variants: {
        variant: {
            line: {
                list: {
                    borderColor: "app.border",
                },
                trigger: {
                    color: "app.muted",
                    fontSize: "sm",
                    px: "3",
                    whiteSpace: "nowrap",
                    _hover: { color: "app.fg" },
                    _selected: {
                        color: "app.fg",
                        "--indicator-color": "colors.app.accent",
                    },
                },
            },
        },
    },
})
