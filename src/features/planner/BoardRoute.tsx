import { getRouteApi } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { PlannerPage } from "./PlannerPage"
import { SharedPlanPage } from "./share/SharedPlanPage"
import { writePlannerLocation } from "./storage/plannerLocation"
import type { BoardView, SidebarTab } from "./types"

const route = getRouteApi("/planner/$classId/$layout")

export const BoardRoute = () => {
    const { classId, layout } = route.useParams()
    const { share } = route.useSearch()
    const classPreset = route.useLoaderData()

    // Above the class-keyed page so they survive class switches.
    const [boardView, setBoardView] = useState<BoardView>("planner")
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>("plan")

    useEffect(() => {
        writePlannerLocation({ classId: classId, layout: layout })
    }, [classId, layout])

    // Keyed by class, so per-class state starts fresh on a new class.
    const plannerPage = (
        <PlannerPage
            key={classId}
            boardView={boardView}
            classId={classId}
            classPreset={classPreset}
            layout={layout}
            sidebarTab={sidebarTab}
            onBoardViewChange={setBoardView}
            onSidebarTabChange={setSidebarTab}
        />
    )

    if (share) {
        return (
            <SharedPlanPage
                classId={classId}
                classPreset={classPreset}
                code={share}
                layout={layout}
                ownPlanner={plannerPage}
            />
        )
    }

    return plannerPage
}
