import type { SystemStyleObject } from "@chakra-ui/react"

// How long the pointer must rest on the strip before its controls unfold.
// No duration token is 250ms, and strict tokens only let a var through.
const HOVER_DELAY: SystemStyleObject = {
    "--hover-delay": "250ms",
    transitionDelay: "var(--hover-delay)",
}

type RevealOptions = {
    // The strip's end the control sits at.
    side: "start" | "end"
    // Widest the control gets, enough for its content.
    maxW: SystemStyleObject["maxW"]
    px?: SystemStyleObject["px"]
}

// Strip controls stay folded away until the pointer rests on the strip (its
// `group`); the delay skips a pointer just passing over. Folded, a control has
// no width, and a negative margin takes back the strip's gap beside it, so it
// grows out of its end of the strip. Folding starts at once.
// Touch screens can't hover, so they always show them.
export const revealOnStripHover = ({
    side,
    maxW,
    px = "0",
}: RevealOptions): SystemStyleObject => {
    const gap: SystemStyleObject =
        side === "start" ? { me: "-1" } : { ms: "-1" }
    const shown: SystemStyleObject = {
        maxW: maxW,
        px: px,
        mx: "0",
        opacity: "visible",
    }

    return {
        _canHover: {
            minW: "0",
            maxW: "0",
            px: "0",
            ...gap,
            overflow: "hidden",
            opacity: "hidden",
            // No token lists these, and strict tokens only let a var through.
            "--reveal-transition":
                "opacity, max-width, padding-inline, margin-inline",
            transitionProperty: "var(--reveal-transition)",
            transitionDuration: "moderate",
            transitionTimingFunction: "ease-out",
            _groupHover: { ...shown, ...HOVER_DELAY },
            _focusVisible: shown,
        },
    }
}

// The drag handle (maxW "4") plus the strip's gap (1).
const HANDLE_SPACE = "-5"

// Slides the strip left as fast as its handle unfolds, so the timers stay
// put while the handle grows out to the left. Same timing as the reveal;
// a shown handle (touch, dragging) keeps it slid.
export const slideWithHandle: SystemStyleObject = {
    ms: HANDLE_SPACE,
    _canHover: {
        ms: "0",
        "--slide-transition": "margin-inline-start",
        transitionProperty: "var(--slide-transition)",
        transitionDuration: "moderate",
        transitionTimingFunction: "ease-out",
        _hover: { ms: HANDLE_SPACE, ...HOVER_DELAY },
    },
}
