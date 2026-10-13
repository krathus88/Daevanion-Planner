import { defineRecipe } from "@chakra-ui/react"

// Shared by Input and NativeSelect's field.
export const fieldStyles = {
    bg: "app.inset",
    borderColor: "app.borderStrong",
    color: "app.fg",
    focusRingColor: "app.accent",
    _focusVisible: { borderColor: "app.accent" },
    _placeholder: { color: "app.subtle" },
} as const

export const inputRecipe = defineRecipe({
    base: {
        // Hide number spinners; they don't fit the narrow inputs. Firefox
        // hides them with `textfield`.
        "&[type=number]": {
            appearance: "textfield",
            "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
                WebkitAppearance: "none",
                m: "0",
            },
        },
    },
    variants: {
        variant: {
            outline: fieldStyles,
        },
    },
})
