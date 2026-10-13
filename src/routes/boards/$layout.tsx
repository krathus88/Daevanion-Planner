import { DEFAULT_CLASS_ID } from "@config/classPresets"
import { DEFAULT_LAYOUT, isLayoutType } from "@planner/config/layouts"
import { createFileRoute, redirect } from "@tanstack/react-router"

// Old /boards/<layout> links, from before classes had their own URLs.
export const Route = createFileRoute("/boards/$layout")({
    beforeLoad: ({ params }) => {
        throw redirect({
            to: "/$classId/$layout",
            params: {
                classId: DEFAULT_CLASS_ID,
                layout: isLayoutType(params.layout)
                    ? params.layout
                    : DEFAULT_LAYOUT,
            },
            replace: true,
        })
    },
})
