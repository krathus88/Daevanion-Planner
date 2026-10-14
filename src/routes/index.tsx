import { readPlannerLocation } from "@planner/storage/plannerLocation"
import { createFileRoute, redirect } from "@tanstack/react-router"

// Opens the planner on the class and board the user had last.
export const Route = createFileRoute("/")({
    beforeLoad: () => {
        throw redirect({
            to: "/planner/$classId/$layout",
            params: readPlannerLocation(),
        })
    },
})
