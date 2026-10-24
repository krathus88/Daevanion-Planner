import { readPlannerLocation } from "@planner/storage/plannerLocation"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
    beforeLoad: () => {
        throw redirect({
            to: "/planner/$classId/$layout",
            params: readPlannerLocation(),
        })
    },
})
