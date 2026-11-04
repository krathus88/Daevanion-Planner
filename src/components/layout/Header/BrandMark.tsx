import { Flex, Text, type FlexProps } from "@chakra-ui/react"

type BrandMarkProps = FlexProps & {
    // Brightens the second line, for when the planner is open.
    isCurrent?: boolean
}

// The logo's text alone, for places that can't hold a link (the menu button).
export const BrandMark = ({ isCurrent = false, ...props }: BrandMarkProps) => {
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
                color={isCurrent ? "app.fg" : "app.muted"}
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
