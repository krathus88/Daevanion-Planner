import { Flex, Text } from "@chakra-ui/react"
import { POINTS_PER_NODE_TYPE, type BoardLayout } from "@planner/config/layouts"
import { LegendSwatch } from "./LegendSwatch"

type BoardLegendProps = {
    layout: BoardLayout
}

export const BoardLegend = ({ layout }: BoardLegendProps) => {
    const nodeTypes = [
        ...Object.entries(layout.specialNodes),
        ["main", layout.mainNode] as const,
    ]

    return (
        <Flex
            flexWrap="wrap"
            alignItems="center"
            justifyContent="space-between"
            rowGap="2"
            columnGap="4"
        >
            <Flex flexWrap="wrap" rowGap="2" columnGap="4">
                {nodeTypes.map(([id, node]) => (
                    <Flex key={id} alignItems="center" gap="2">
                        <LegendSwatch type={node.type} />

                        <Text color="app.muted" fontSize="xs">
                            {node.name}{" "}
                            <Text as="span" color="app.subtle">
                                · {POINTS_PER_NODE_TYPE[node.type]} pts
                            </Text>
                        </Text>
                    </Flex>
                ))}
            </Flex>

            <Text textStyle="caption">
                {layout.grid.length} × {layout.grid[0].length} grid
            </Text>
        </Flex>
    )
}
