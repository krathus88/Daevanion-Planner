import { Flex, Text } from "@chakra-ui/react"
import type { ReactNode } from "react"

type NumberedStepProps = {
    children: ReactNode
    step: number
}

export const NumberedStep = ({ children, step }: NumberedStepProps) => {
    return (
        <Flex as="li" alignItems="center" gap="2.5">
            <Flex
                boxSize="6"
                flexShrink="0"
                alignItems="center"
                justifyContent="center"
                bg="app.accent"
                borderRadius="full"
                color="app.accentFg"
                fontSize="xs"
                fontWeight="bold"
            >
                {step}
            </Flex>

            <Text fontSize="sm">{children}</Text>
        </Flex>
    )
}
