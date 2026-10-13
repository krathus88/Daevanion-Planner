import { useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import type { BoardView } from "@components/daevanion-board/components/BoardWorkspace"
import { Daevanion } from "./Daevanion"

const route = getRouteApi("/$classId/$layout")

export const BoardRoute = () => {
    const { classId, layout } = route.useParams()
    // Planner/Manual is the user's choice and survives class switches, so it
    // lives above the class-keyed page.
    const [boardView, setBoardView] = useState<BoardView>("planner")

    // Keyed by class: switching class starts the sidebar on the Plan tab,
    // while switching board keeps it.
    return (
        <Daevanion
            boardView={boardView}
            classId={classId}
            key={classId}
            layout={layout}
            onBoardViewChange={setBoardView}
        />
    )
}
