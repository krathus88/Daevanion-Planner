import { Flex, Text } from "@chakra-ui/react"
import type { ReactNode } from "react"

type ImportStepProps = {
    children: ReactNode
    step: number
}

export const ImportStep = ({ children, step }: ImportStepProps) => {
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
