import { chakra, Icon, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { LuChevronDown, LuPanelLeftOpen } from "react-icons/lu"

type PetFinderMinimizedProps = {
    count: number
    onExpand: () => void
}

// The minimized pet list: a narrow strip beside the map on wide screens, a
// short bar above it otherwise. Clicking it opens the list again.
export const PetFinderMinimized = ({
    count,
    onExpand,
}: PetFinderMinimizedProps) => {
    return (
        <Card pos={{ lg: "sticky" }} top={{ lg: "20" }} p="0">
            <chakra.button
                px={{ base: "3", lg: "2" }}
                py={{ base: "2", lg: "3" }}
                display="flex"
                flexDir={{ base: "row", lg: "column" }}
                alignItems="center"
                gap="2"
                borderRadius="sm"
                textAlign="left"
                cursor="button"
                type="button"
                title="Show pet list"
                aria-expanded="false"
                onClick={onExpand}
            >
                <Icon boxSize="4" color="app.muted" hideBelow="lg">
                    <LuPanelLeftOpen />
                </Icon>

                <Icon boxSize="4" color="app.muted" hideFrom="lg">
                    <LuChevronDown />
                </Icon>

                <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    writingMode={{ lg: "vertical-rl" }}
                >
                    Pet list
                </Text>

                <Text textStyle="caption" writingMode={{ lg: "vertical-rl" }}>
                    {count} shown
                </Text>
            </chakra.button>
        </Card>
    )
}
