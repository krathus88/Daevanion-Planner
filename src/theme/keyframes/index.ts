import { defineKeyframes } from "@chakra-ui/react"

// A glow in the element's colour palette that swells and settles, e.g. a
// timer that's open right now. It never drops below the steady glow of a
// timer about to start, so open always reads as the louder of the two. One
// per tone of the timer highlight recipe.
const glowPulse = (shade: string) => {
    return {
        "0%, 100%": {
            boxShadow: `0 0 8px 0 var(--chakra-colors-color-palette-${shade})`,
        },
        "50%": {
            boxShadow: `0 0 16px 3px var(--chakra-colors-color-palette-${shade})`,
        },
    }
}

export const keyframes = defineKeyframes({
    timerPulseStrong: glowPulse("500"),
    timerPulseSoft: glowPulse("300"),
})
