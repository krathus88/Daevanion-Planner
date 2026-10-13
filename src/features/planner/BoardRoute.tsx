import { getRouteApi } from "@tanstack/react-router"
import { useState } from "react"
import { PlannerPage } from "./PlannerPage"
import type { BoardView } from "./types"

const route = getRouteApi("/$classId/$layout")

export const BoardRoute = () => {
    const { classId, layout } = route.useParams()

    // Planner/Manual is the user's choice and survives class switches, so it
    // lives above the class-keyed page.
    const [boardView, setBoardView] = useState<BoardView>("planner")

    // Keyed by class: switching class starts the sidebar on the Plan tab,
    // while switching board keeps it.
    return (
        <PlannerPage
            key={classId}
            boardView={boardView}
            classId={classId}
            layout={layout}
            onBoardViewChange={setBoardView}
        />
    )
}
