import { Flex, Text } from "@chakra-ui/react"

// Two lines on phones so the class picker fits beside it; one line from md up.
export const Brand = () => {
    return (
        <Flex
            flexShrink="0"
            flexDir={{ base: "column", md: "row" }}
            alignItems={{ base: "flex-start", md: "baseline" }}
            columnGap="2"
            lineHeight={{ base: "tight", md: "normal" }}
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
