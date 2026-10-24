import { Flex, Text } from "@chakra-ui/react"

type ShortfallRowProps = {
    name: string
    // Got versus needed, e.g. "+1 / +4".
    value: string
}

export const ShortfallRow = ({ name, value }: ShortfallRowProps) => {
    return (
        <Flex minW="0" justifyContent="space-between" gap="3" fontSize="sm">
            <Text minW="0" truncate title={name}>
                {name}
            </Text>

            <Text
                flexShrink="0"
                color="app.danger"
                fontVariantNumeric="tabular-nums"
                whiteSpace="nowrap"
            >
                {value}
            </Text>
        </Flex>
    )
}
