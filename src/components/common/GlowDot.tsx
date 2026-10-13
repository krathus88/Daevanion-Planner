import { Box } from "@chakra-ui/react"

export const GlowDot = () => {
    return (
        <Box
            boxSize="1.5"
            bg="app.accent"
            borderRadius="full"
            boxShadow="accent.dot"
            animation="glowPulse"
            aria-hidden="true"
        />
    )
}
