import { Box } from "@chakra-ui/react"
import type { BoardLayout } from "@planner/config/layouts"
import { memo } from "react"
import { CELL_BOX } from "./nodeStyles"
import { NodeCell, type NodeCellProps } from "./NodeCell"
import { StartCell } from "./StartCell"

type BoardCellProps = Omit<NodeCellProps, "appearance"> & {
    // "." empty, "S" start, "#" stat, or a special node letter.
    kind: string
    layout: BoardLayout
}

// memo: the grid re-maps every cell on each click, and the compiler can't skip
// cells inside that map.
export const BoardCell = memo(function BoardCell({
    kind,
    layout,
    ...props
}: BoardCellProps) {
    if (kind === ".") {
        return <Box boxSize={CELL_BOX} aria-hidden="true" />
    }

    if (kind === "S") {
        return <StartCell node={layout.startNode} />
    }

    return (
        <NodeCell
            appearance={layout.specialNodes[kind] ?? layout.mainNode}
            {...props}
        />
    )
})
