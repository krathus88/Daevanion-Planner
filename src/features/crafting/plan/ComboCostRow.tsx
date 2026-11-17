import { Flex, Text } from "@chakra-ui/react"
import type { ReactNode } from "react"

type ComboCostRowProps = {
    // The Kinah, its loading placeholder, or a price field.
    amount: ReactNode
    label: string
}

// One way to get the Splendent item: "Craft it 15,212,321 Kinah".
export const ComboCostRow = ({ amount, label }: ComboCostRowProps) => {
    return (
        <Flex alignItems="baseline" gap="3">
            <Text w="16" flexShrink="0" color="app.muted" fontSize="sm">
                {label}
            </Text>

            {/* A div: the amount can be a field. */}
            <Flex
                minW="0"
                alignItems="baseline"
                color="app.fg"
                fontSize="lg"
                fontWeight="semibold"
            >
                {amount}
            </Flex>
        </Flex>
    )
}
