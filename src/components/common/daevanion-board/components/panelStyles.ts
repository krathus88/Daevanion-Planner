export const appInputStyles = {
    background: "app.inset",
    borderColor: "app.borderStrong",
    color: "app.fg",
    _placeholder: { color: "app.subtle" },
    _focusVisible: {
        borderColor: "app.accent",
        outline: "1px solid",
        outlineColor: "app.accent",
    },
    // Hide number spinners; they don't fit the narrow inputs.
    // Firefox hides spinners with `textfield`; Chakra drops `MozAppearance`.
    appearance: "textfield",
    "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
        WebkitAppearance: "none",
        margin: 0,
    },
} as const

// Select the whole value on focus so typing replaces it. Re-select on the
// next frame because a mouse click can clear the selection on mouseup.
export const selectAllOnFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    input.select()
    requestAnimationFrame(() => input.select())
}
