import { Box } from "@chakra-ui/react"

type GlowDotProps = {
    // Gold draws the eye to something new; green says something is live.
    tone?: "accent" | "success"
}

const TONES = {
    accent: { bg: "app.accent", boxShadow: "accent.dot" },
    success: { bg: "app.success", boxShadow: "success.dot" },
} as const

export const GlowDot = ({ tone = "accent" }: GlowDotProps) => {
    return (
        <Box
            boxSize="1.5"
            bg={TONES[tone].bg}
            borderRadius="full"
            boxShadow={TONES[tone].boxShadow}
            animation="glowPulse"
            aria-hidden="true"
        />
    )
}
