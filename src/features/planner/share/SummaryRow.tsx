import { Flex, Text, type Tokens } from "@chakra-ui/react"

type SummaryRowProps = {
    label: string
    value?: string
    valueColor?: Tokens["colors"]
}

export const SummaryRow = ({
    label,
    value,
    valueColor = "app.muted",
}: SummaryRowProps) => {
    return (
        <Flex minW="0" alignItems="baseline" gap="2" fontSize="sm">
            <Text minW="0" flex="1" truncate>
                {label}
            </Text>

            {value && (
                <Text flexShrink="0" color={valueColor}>
                    {value}
                </Text>
            )}
        </Flex>
    )
}
