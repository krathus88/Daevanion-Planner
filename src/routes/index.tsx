import { DEFAULT_CLASS_ID } from "@config/classPresets"
import { DEFAULT_LAYOUT } from "@planner/config/layouts"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
    beforeLoad: () => {
        throw redirect({
            to: "/$classId/$layout",
            params: { classId: DEFAULT_CLASS_ID, layout: DEFAULT_LAYOUT },
        })
    },
})
