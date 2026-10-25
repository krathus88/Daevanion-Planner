import { isBoardId } from "@config/boards"
import { isClassId } from "@config/classPresets"
import { readPlannerLocation } from "@planner/storage/plannerLocation"
import { createFileRoute, redirect } from "@tanstack/react-router"

// Old links (/<class>/<board>, /boards/<board>) and unknown paths. Whatever
// part is recognised is kept; the rest comes from the last visited board.
export const Route = createFileRoute("/$")({
    beforeLoad: ({ params }) => {
        const [first, second] = (params._splat ?? "").split("/").filter(Boolean)
        const saved = readPlannerLocation()

        throw redirect({
            to: "/planner/$classId/$layout",
            params: {
                classId: first && isClassId(first) ? first : saved.classId,
                layout: second && isBoardId(second) ? second : saved.layout,
            },
            search: true,
            replace: true,
        })
    },
})
