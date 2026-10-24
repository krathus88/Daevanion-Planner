import { Flex, Text, type FlexProps } from "@chakra-ui/react"

export const Brand = ({ ...props }: FlexProps) => {
    return (
        <Flex
            flexShrink="0"
            flexDir={{ base: "column", md: "row" }}
            alignItems={{ base: "flex-start", md: "baseline" }}
            columnGap="2"
            lineHeight={{ base: "tight", md: "normal" }}
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

            <Text color="app.muted" fontSize="lg">
                Planner
            </Text>
        </Flex>
    )
}
