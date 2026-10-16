import { defineKeyframes } from "@chakra-ui/react"

// A glow in the element's colour palette that swells and settles, e.g. a
// timer that's open right now. It never drops below the steady glow of a
// timer about to start, so open always reads as the louder of the two. The
// border flashes with it, almost fading out as the glow settles. One per tone
// of the timer highlight recipe.
const glowPulse = (glowShade: string, borderShade: string) => {
    const border = `var(--chakra-colors-color-palette-${borderShade})`

    return {
        "0%, 100%": {
            boxShadow: `0 0 8px 0 var(--chakra-colors-color-palette-${glowShade})`,
            borderColor: `color-mix(in srgb, ${border} 10%, transparent)`,
        },
        "50%": {
            boxShadow: `0 0 16px 3px var(--chakra-colors-color-palette-${glowShade})`,
            borderColor: border,
        },
    }
}

// A gentler border flash for a timer about to start, dimming only to half so
// it stays quieter than an open one. One per tone of the timer highlight
// recipe.
const borderFlash = (shade: string) => {
    const border = `var(--chakra-colors-color-palette-${shade})`

    return {
        "0%, 100%": {
            borderColor: `color-mix(in srgb, ${border} 50%, transparent)`,
        },
        "50%": { borderColor: border },
    }
}

export const keyframes = defineKeyframes({
    timerPulseStrong: glowPulse("500", "400"),
    timerPulseSoft: glowPulse("300", "200"),
    timerFlashStrong: borderFlash("400"),
    timerFlashSoft: borderFlash("200"),
})
