import { Flex, Text } from "@chakra-ui/react"
import type { OptimizeShortfall } from "@planner/hooks/useOptimizeAllBoards"
import { ShortfallRow } from "./ShortfallRow"

type ShortfallWarningProps = {
    shortfall: OptimizeShortfall
}

// What the last all-board run couldn't fit in the budget, one row per item.
export const ShortfallWarning = ({ shortfall }: ShortfallWarningProps) => {
    const specialNodes = shortfall.specialNodes
    const isSpecialShort = specialNodes.taken < specialNodes.total

    return (
        <Flex
            layerStyle="alert"
            p="3"
            flexDir="column"
            gap="3"
            role="alert"
        >
            <Text color="app.danger" fontSize="sm" fontWeight="semibold">
                Not enough points
            </Text>

            {isSpecialShort && (
                <ShortfallRow
                    name="Special nodes"
                    value={`${specialNodes.taken} / ${specialNodes.total}`}
                />
            )}

            {shortfall.shortfalls.length > 0 && (
                <Flex flexDir="column" gap="1">
                    <Text textStyle="label">Minimums not met</Text>

                    {shortfall.shortfalls.map((item) => (
                        <ShortfallRow
                            key={item.abilityId}
                            name={item.name}
                            value={`+${item.achieved} / +${item.required}`}
                        />
                    ))}
                </Flex>
            )}
        </Flex>
    )
}
