import { defineTokens } from "@chakra-ui/react"

export const gradients = defineTokens.gradients({
    board: {
        // Gold glow at the centre, faint rings, and a dark vignette.
        frame: {
            value: "radial-gradient(circle at 50% 50%, rgba(217, 179, 108, 0.22) 0 6%, transparent 30%), repeating-radial-gradient(circle at 50% 50%, transparent 0 11.5%, rgba(217, 179, 108, 0.07) 11.5% 11.8%), radial-gradient(ellipse at 50% 50%, #161b27 0%, #0b0e15 62%, #06080c 100%)",
        },
        start: {
            value: "radial-gradient(circle at 50% 40%, #fbe7b5 0%, #e3b866 45%, #a87b34 100%)",
        },
        special: {
            value: "linear-gradient(135deg, #f6d68a 0%, #d9a441 45%, #9a6a22 100%)",
        },
        // Ariel's 2 and 3 point stat nodes: a faceted gem in the passive or
        // skill colour, like the special nodes' diamonds, brighter once taken.
        orb: {
            skill: {
                value: "conic-gradient(from 45deg, #2d68b5, #12305a, #1f4f8f, #12305a, #2d68b5)",
            },
            skillLit: {
                value: "conic-gradient(from 45deg, #cfe4ff, #4b8fe6, #a9d0ff, #4b8fe6, #cfe4ff)",
            },
            passive: {
                value: "conic-gradient(from 45deg, #26894f, #0f3d22, #1c6b3d, #0f3d22, #26894f)",
            },
            passiveLit: {
                value: "conic-gradient(from 45deg, #b6f7cf, #3fbf72, #86efac, #3fbf72, #b6f7cf)",
            },
        },
        gem: {
            sheen: {
                value: "linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 45%)",
            },
            facet: {
                value: "linear-gradient(135deg, #fff3cc 0%, #ebbd5e 50%, #b5802c 100%)",
            },
            core: {
                value: "radial-gradient(circle at 40% 35%, #ffffff 0%, #fff4d1 45%, #f0c66a 100%)",
            },
        },
    },
})
