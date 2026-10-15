import type { ClassAbility } from "@config/classPresets"
import { Box, Flex, Grid } from "@chakra-ui/react"
import { getStart, keyOf, type Position } from "@planner/config/boardConfig"
import type { BoardLayout } from "@planner/config/layouts"
import { useFitScale } from "@planner/hooks/useFitScale"
import { getConnectionCosts, nodeCost } from "@planner/logic/boardLogic"
import { BoardEdges } from "./BoardEdges"
import { gridExtent } from "./boardMetrics"
import { BoardCell } from "./cell/BoardCell"

type CellStateInput = {
    layout: BoardLayout
    start: Position
    position: Position
    mode: "interactive" | "planner" | "readonly"
    selectedCells: Set<string>
    // Cheapest cost to connect this node to the selection, if reachable.
    connectionCost: number | undefined
    availablePoints: number
}

const getCellState = ({
    layout,
    start,
    position,
    mode,
    selectedCells,
    connectionCost,
    availablePoints,
}: CellStateInput) => {
    const selected = selectedCells.has(keyOf(position))
    const isStart =
        position.row === start.row && position.column === start.column
    const neighbors: Position[] = [
        { row: position.row - 1, column: position.column },
        { row: position.row + 1, column: position.column },
        { row: position.row, column: position.column - 1 },
        { row: position.row, column: position.column + 1 },
    ]
    // In Manual mode, an affordable node right next to the selection.
    const adjacentAvailable =
        mode === "interactive" &&
        !selected &&
        !isStart &&
        nodeCost(layout, position) <= availablePoints &&
        neighbors.some(
            (neighbor) =>
                (neighbor.row === start.row &&
                    neighbor.column === start.column) ||
                selectedCells.has(keyOf(neighbor)),
        )
    const affordable =
        selected ||
        (connectionCost !== undefined && connectionCost <= availablePoints)

    return {
        selected: selected,
        adjacentAvailable: adjacentAvailable,
        canSelect:
            mode !== "readonly" &&
            !isStart &&
            (mode === "planner" || affordable),
    }
}

type BoardGridProps = {
    layout: BoardLayout
    abilitiesByPosition: Readonly<Record<string, ClassAbility>>
    // "readonly" draws a plan without letting anything be picked.
    mode: "interactive" | "planner" | "readonly"
    selectedCells: Set<string>
    targetCells: Set<string>
    availablePoints: number
    onSelect: (position: Position) => void
}

export const BoardGrid = ({
    layout,
    abilitiesByPosition,
    mode,
    selectedCells,
    targetCells,
    availablePoints,
    onSelect,
}: BoardGridProps) => {
    const columns = layout.grid[0].length
    const contentWidth = gridExtent(columns)
    const contentHeight = gridExtent(layout.grid.length)

    const { frameRef, scale, isScrollable } = useFitScale(
        contentWidth,
        contentHeight,
    )

    const start = getStart(layout)
    const connectionCosts = getConnectionCosts(layout, start, selectedCells)
    const connectedCells = new Set(selectedCells)
    connectedCells.add(keyOf(start))

    return (
        <Flex
            ref={frameRef}
            p="4"
            w="full"
            minW="0"
            maxW="board"
            aspectRatio="square"
            alignItems={isScrollable ? "flex-start" : "center"}
            justifyContent={isScrollable ? "flex-start" : "center"}
            overflow="auto"
            bgImage="board.frame"
            borderRadius="boardFrame"
        >
            {/* Takes the scaled size, so the frame centres and scrolls it.
                The size is computed, so it goes in style, not a token. */}
            <Box
                pos="relative"
                m={isScrollable ? "0" : "auto"}
                flex="none"
                style={{
                    height: contentHeight * scale,
                    width: contentWidth * scale,
                }}
            >
                <Grid
                    pos="absolute"
                    top="0"
                    left="0"
                    w="max"
                    gridTemplateColumns={`repeat(${columns}, 3.5rem)`}
                    gap="2.5"
                    transform={`scale(${scale})`}
                    transformOrigin="top left"
                >
                    <BoardEdges
                        connectedCells={connectedCells}
                        layout={layout}
                    />

                    {layout.grid.flatMap((row, rowIndex) =>
                        [...row].map((kind, columnIndex) => {
                            const position = {
                                row: rowIndex,
                                column: columnIndex,
                            }
                            const key = `${rowIndex},${columnIndex}`
                            const state = getCellState({
                                layout: layout,
                                start: start,
                                position: position,
                                mode: mode,
                                selectedCells: selectedCells,
                                connectionCost: connectionCosts.get(key),
                                availablePoints: availablePoints,
                            })

                            return (
                                <BoardCell
                                    key={key}
                                    ability={abilitiesByPosition[key]}
                                    adjacentAvailable={state.adjacentAvailable}
                                    canSelect={state.canSelect}
                                    kind={kind}
                                    layout={layout}
                                    selected={state.selected}
                                    specialBonus={
                                        layout.specialNodeBonuses[key]
                                    }
                                    stat={layout.nodeStats[key]}
                                    targeted={targetCells.has(key)}
                                    position={position}
                                    readOnly={mode === "readonly"}
                                    onSelect={onSelect}
                                />
                            )
                        }),
                    )}
                </Grid>
            </Box>
        </Flex>
    )
}
