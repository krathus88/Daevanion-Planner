import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"
import { globalCss } from "./global-css"
import { keyframes } from "./keyframes"
import { layerStyles } from "./layer-styles"
import { recipes } from "./recipes"
import { semanticTokens } from "./semantic-tokens"
import { slotRecipes } from "./slot-recipes"
import { textStyles } from "./text-styles"
import { tokens } from "./tokens"
import { utilities } from "./utilities"

const config = defineConfig({
    strictTokens: true,
    conditions: {
        // Devices with a mouse or trackpad; touch screens can't hover.
        canHover: "@media (hover: hover)",
    },
    globalCss: globalCss,
    utilities: utilities,
    theme: {
        tokens: tokens,
        keyframes: keyframes,
        semanticTokens: semanticTokens,
        textStyles: textStyles,
        layerStyles: layerStyles,
        recipes: recipes,
        slotRecipes: slotRecipes,
    },
})

export const system = createSystem(defaultConfig, config)
