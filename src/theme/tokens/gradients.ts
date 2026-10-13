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
