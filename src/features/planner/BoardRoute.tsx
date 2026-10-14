import { getRouteApi } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { PlannerPage } from "./PlannerPage"
import { writePlannerLocation } from "./storage/plannerLocation"
import type { BoardView } from "./types"

const route = getRouteApi("/planner/$classId/$layout")

export const BoardRoute = () => {
    const { classId, layout } = route.useParams()

    // Planner/Manual is the user's choice and survives class switches, so it
    // lives above the class-keyed page.
    const [boardView, setBoardView] = useState<BoardView>("planner")

    // Other pages show this class, and the Planner link comes back here.
    useEffect(() => {
        writePlannerLocation({ classId: classId, layout: layout })
    }, [classId, layout])

    // Keyed by class: switching class starts the sidebar on the This board
    // tab, while switching board keeps it.
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
