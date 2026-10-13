import { useEffect, useRef, useState } from "react"
import { Box, Flex, Grid } from "@chakra-ui/react"
import { getStart, isNode, type Position } from "../config/boardConfig"
import { BoardCell } from "./BoardCell"
import { getConnectionCosts, nodeCost } from "../logic/boardLogic"
import type { BoardLayout } from "../config/layouts"
import type { ClassAbility } from "../../../../config/classPresets"

type BoardGridProps = {
    layout: BoardLayout
    selectedCells: Set<string>
    availablePoints: number
    mode: "interactive" | "planner"
    targetCells: Set<string>
    abilitiesByPosition: Readonly<Record<string, ClassAbility>>
    onSelect: (position: Position) => void
}

export const BoardGrid = ({
    layout,
    selectedCells,
    availablePoints,
    mode,
    targetCells,
    abilitiesByPosition,
    onSelect,
}: BoardGridProps) => {
    const frameRef = useRef<HTMLDivElement>(null)
    const [gridScale, setGridScale] = useState(1)
    const start = getStart(layout)
    const connectionCosts = getConnectionCosts(layout, start, selectedCells)
    const connectedCells = new Set(selectedCells)
    connectedCells.add(`${start.row},${start.column}`)
    const cellSize = 56
    const cellPitch = 66
    const contentWidth =
        layout.grid[0].length * cellSize + (layout.grid[0].length - 1) * 10
    const contentHeight =
        layout.grid.length * cellSize + (layout.grid.length - 1) * 10
    const isGridScrollable = gridScale <= 0.55

    useEffect(() => {
        const frame = frameRef.current
        if (!frame) {
            return
        }

        const updateScale = () => {
            const availableWidth = frame.clientWidth - 32
            const availableHeight = frame.clientHeight - 32
            if (availableWidth <= 0 || availableHeight <= 0) {
                return
            }

            const scale = Math.min(
                1,
                availableWidth / contentWidth,
                availableHeight / contentHeight,
            )
            const nextScale = Math.max(0.55, scale)
            setGridScale((current) =>
                Math.abs(current - nextScale) < 0.01 ? current : nextScale,
            )
        }

        const observer = new ResizeObserver(updateScale)
        observer.observe(frame)
        updateScale()

        return () => observer.disconnect()
    }, [contentHeight, contentWidth])

    return (
        <Flex
            ref={frameRef}
            p="1rem"
            width="100%"
            maxWidth="880px"
            minWidth="0"
            aspectRatio="1"
            alignItems={isGridScrollable ? "flex-start" : "center"}
            justifyContent={isGridScrollable ? "flex-start" : "center"}
            borderRadius="10px"
            overflow="auto"
            bg="radial-gradient(circle at 50% 50%,rgba(217,179,108,.22) 0 6%,transparent 30%), repeating-radial-gradient(circle at 50% 50%,transparent 0 11.5%,rgba(217,179,108,.07) 11.5% 11.8%), radial-gradient(ellipse at 50% 50%,#161b27 0%,#0b0e15 62%,#06080c 100%)"
        >
            <Box
                flex="none"
                height={`${contentHeight * gridScale}px`}
                margin={isGridScrollable ? "0" : "auto"}
                position="relative"
                width={`${contentWidth * gridScale}px`}
            >
                <Grid
                    flex="none"
                    gap="2.5"
                    gridTemplateColumns={`repeat(${layout.grid[0].length}, 3.5rem)`}
                    left="0"
                    position="absolute"
                    style={{
                        transform: `scale(${gridScale})`,
                        transformOrigin: "top left",
                    }}
                    top="0"
                    width="max-content"
                >
                    {layout.grid.flatMap((row, rowIndex) =>
                        [...row].flatMap((_, columnIndex) => {
                            if (
                                !isNode(layout, {
                                    row: rowIndex,
                                    column: columnIndex,
                                })
                            ) {
                                return []
                            }

                            const key = `${rowIndex},${columnIndex}`
                            const connected = connectedCells.has(key)
                            const lines = [
                                {
                                    row: rowIndex,
                                    column: columnIndex + 1,
                                    horizontal: true,
                                },
                                {
                                    row: rowIndex + 1,
                                    column: columnIndex,
                                    horizontal: false,
                                },
                            ]

                            return lines.flatMap((line) => {
                                if (
                                    !isNode(layout, {
                                        row: line.row,
                                        column: line.column,
                                    })
                                ) {
                                    return []
                                }

                                const neighborKey = `${line.row},${line.column}`
                                const edgeConnected =
                                    connected && connectedCells.has(neighborKey)
                                const x = cellSize / 2 + columnIndex * cellPitch
                                const y = cellSize / 2 + rowIndex * cellPitch

                                return (
                                    <Flex
                                        aria-hidden="true"
                                        background={
                                            edgeConnected
                                                ? "rgba(255, 204, 102, 0.88)"
                                                : "rgba(148, 163, 184, 0.16)"
                                        }
                                        borderRadius="full"
                                        boxShadow={
                                            edgeConnected
                                                ? "0 0 7px rgba(255, 204, 102, 0.28)"
                                                : "none"
                                        }
                                        height={edgeConnected ? "4px" : "1px"}
                                        key={`${key}-${neighborKey}`}
                                        left={
                                            line.horizontal
                                                ? `${x}px`
                                                : `${x - 1}px`
                                        }
                                        position="absolute"
                                        top={
                                            line.horizontal
                                                ? `${y - 1}px`
                                                : `${y}px`
                                        }
                                        transform={
                                            line.horizontal
                                                ? undefined
                                                : "rotate(90deg)"
                                        }
                                        transformOrigin="left center"
                                        width={`${cellPitch}px`}
                                        zIndex="0"
                                    />
                                )
                            })
                        }),
                    )}

                    {layout.grid.flatMap((row, rowIndex) =>
                        [...row].map((kind, columnIndex) => {
                            const position = {
                                row: rowIndex,
                                column: columnIndex,
                            }
                            const key = `${rowIndex},${columnIndex}`
                            const selected = selectedCells.has(key)
                            const ability = abilitiesByPosition[key]
                            const connectionCost = connectionCosts.get(key)
                            const isStartCell =
                                position.row === start.row &&
                                position.column === start.column
                            const neighbors = [
                                {
                                    row: position.row - 1,
                                    column: position.column,
                                },
                                {
                                    row: position.row + 1,
                                    column: position.column,
                                },
                                {
                                    row: position.row,
                                    column: position.column - 1,
                                },
                                {
                                    row: position.row,
                                    column: position.column + 1,
                                },
                            ]
                            const adjacentAvailable =
                                mode === "interactive" &&
                                !selected &&
                                !isStartCell &&
                                nodeCost(layout, position) <= availablePoints &&
                                neighbors.some((neighbor) => {
                                    const neighborKey = `${neighbor.row},${neighbor.column}`

                                    return (
                                        (neighbor.row === start.row &&
                                            neighbor.column === start.column) ||
                                        selectedCells.has(neighborKey)
                                    )
                                })
                            const affordable =
                                selected ||
                                (connectionCost !== undefined &&
                                    connectionCost <= availablePoints)

                            return (
                                <BoardCell
                                    key={key}
                                    kind={kind}
                                    onSelect={onSelect}
                                    position={position}
                                    selected={selected}
                                    canSelect={
                                        !isStartCell &&
                                        (mode === "planner" || affordable)
                                    }
                                    adjacentAvailable={adjacentAvailable}
                                    targeted={targetCells.has(key)}
                                    ability={ability}
                                    mainNode={layout.mainNode}
                                    startNode={layout.startNode}
                                    specialNodes={layout.specialNodes}
                                />
                            )
                        }),
                    )}
                </Grid>
            </Box>
        </Flex>
    )
}
