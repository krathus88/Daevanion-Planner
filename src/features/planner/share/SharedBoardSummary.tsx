import { Flex, Text } from "@chakra-ui/react"
import type { BoardId } from "@config/boards"
import { Card } from "@common/Card"
import { StatTile } from "@common/StatTile"
import { layouts } from "@planner/config/layouts"
import { nodeCost } from "@planner/logic/boardLogic"
import type { BoardView } from "@planner/types"
import type { SharedBoard } from "./shareCode"

type SharedBoardSummaryProps = {
    board: SharedBoard
    layout: BoardId
    view: BoardView
}

const spentPoints = (layout: BoardId, cells: string[]) => {
    return cells.reduce((total, cell) => {
        const [row, column] = cell.split(",").map(Number)
        return total + nodeCost(layouts[layout], { row: row, column: column })
    }, 0)
}

export const SharedBoardSummary = ({
    board,
    layout,
    view,
}: SharedBoardSummaryProps) => {
    const { route, selection } = board

    if (view === "planner" && route) {
        return (
            <Card>
                {route.name && <Text fontWeight="medium">{route.name}</Text>}

                <Flex gap="3">
                    <StatTile
                        label="Required nodes"
                        value={route.targetCells.length}
                    />

                    <StatTile
                        label="Route cost"
                        value={
                            route.plannedCost === null
                                ? "—"
                                : `${route.plannedCost} / ${route.availablePoints}`
                        }
                    />
                </Flex>

                {route.plannedCost === null && (
                    <Text textStyle="hint">
                        Not optimized yet: only the required nodes are shared.
                    </Text>
                )}
            </Card>
        )
    }

    if (!selection) {
        return null
    }

    return (
        <Card flexDir="row">
            <StatTile label="Nodes" value={selection.selectedCells.length} />

            <StatTile
                label="Spent"
                value={spentPoints(layout, selection.selectedCells)}
            />

            <StatTile label="Budget" value={selection.availablePoints} />
        </Card>
    )
}
