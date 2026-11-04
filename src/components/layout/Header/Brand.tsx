import { Flex, Text, type FlexProps } from "@chakra-ui/react"

export const Brand = ({ ...props }: FlexProps) => {
    return (
        <Flex
            flexShrink="0"
            flexDir="column"
            alignItems="flex-start"
            lineHeight="shorter"
            userSelect="none"
            {...props}
        >
            <Text
                color="app.accent"
                fontSize="lg"
                fontWeight="bold"
                letterSpacing="tight"
            >
                Daevanion
            </Text>

            <Text
                color="app.muted"
                fontSize="xs"
                fontWeight="semibold"
                letterSpacing="widest"
                textTransform="uppercase"
            >
                Planner
            </Text>
        </Flex>
    )
}
