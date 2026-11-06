import type { SystemStyleObject } from "@chakra-ui/react"

// For `_canHover`: hidden until a `group` ancestor is hovered or it has
// keyboard focus (touch screens always show it). It fades in but hides at
// once, so moving across rows leaves no trail of fading buttons.
export const HOVER_REVEAL: SystemStyleObject = {
    opacity: "hidden",
    transitionProperty: "none",
    _groupHover: { opacity: "visible", transitionProperty: "common" },
    _focusVisible: { opacity: "visible", transitionProperty: "common" },
}
