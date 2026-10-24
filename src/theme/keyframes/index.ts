import { defineKeyframes } from "@chakra-ui/react"

// Never dims below the "soon" glow, so open always reads louder.
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
