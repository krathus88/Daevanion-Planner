import { Badge, Flex, Text } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"

// The name of the route on the board, and whether it's saved or from the
// optimizer history.
export const ActiveRoute = () => {
    const { planner } = useBoard()

    return (
        <Flex minW="0" alignItems="center" gap="2">
            <Text flexShrink="0" textStyle="caption">
                Active route
            </Text>

            <Text minW="0" flex="1" fontSize="sm" fontWeight="medium" truncate>
                {planner.activePlanner?.name ?? "Unsaved route"}
            </Text>

            {planner.activePlanner && (
                <Badge
                    size="sm"
                    flexShrink="0"
                    bg="app.accentMuted"
                    color="app.accent"
                >
                    {planner.activePlanner.source === "saved"
                        ? "Saved"
                        : "History"}
                </Badge>
            )}
        </Flex>
    )
}
