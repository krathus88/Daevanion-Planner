import { createFileRoute, redirect } from "@tanstack/react-router"
import { DEFAULT_CLASS_ID } from "@config/classPresets"

export const Route = createFileRoute("/")({
    beforeLoad: () => {
        throw redirect({
            to: "/$classId/$layout",
            params: { classId: DEFAULT_CLASS_ID, layout: "nezekan" },
        })
    },
})
