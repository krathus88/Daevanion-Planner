import { isLayoutType } from "@components/daevanion-board/config/layouts"
import { DEFAULT_CLASS_ID } from "@config/classPresets"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/boards/$layout")({
    beforeLoad: ({ params }) => {
        throw redirect({
            to: "/$classId/$layout",
            params: {
                classId: DEFAULT_CLASS_ID,
                layout: isLayoutType(params.layout) ? params.layout : "nezekan",
            },
            replace: true,
        })
    },
})
