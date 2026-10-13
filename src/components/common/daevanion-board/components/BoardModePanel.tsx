import type { BoardWorkspaceProps } from "./BoardWorkspace"
import { BoardSelectionPanel } from "./BoardSelectionPanel"
import { PlannerPanel } from "./PlannerPanel"

export const BoardModePanel = (props: BoardWorkspaceProps) => {
    const { view } = props

    return view === "board" ? (
        <BoardSelectionPanel {...props} />
    ) : (
        <PlannerPanel {...props} />
    )
}
