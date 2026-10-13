import { SegmentGroup } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import type { BoardView } from "@planner/types"

const modes: { value: BoardView; label: string }[] = [
    { value: "planner", label: "Planner" },
    { value: "board", label: "Manual" },
]

export const ModeToggle = () => {
    const { view, changeView } = useBoard()

    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        changeView(details.value as BoardView)
    }

    return (
        <SegmentGroup.Root
            layout="fill"
            value={view}
            aria-label="Board mode"
            onValueChange={handleValueChange}
        >
            <SegmentGroup.Indicator />

            <SegmentGroup.Items items={modes} />
        </SegmentGroup.Root>
    )
}
