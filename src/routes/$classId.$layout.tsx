import { BoardRoute } from "@features/projects/BoardRoute"
import { isLayoutType } from "@components/daevanion-board/config/layouts"
import { DEFAULT_CLASS_ID, isClassId } from "@config/classPresets"
import { createFileRoute, notFound, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/$classId/$layout")({
    params: {
        parse: ({ classId, layout }) => {
            if (!isClassId(classId) || !isLayoutType(layout)) throw notFound()
            return { classId, layout }
        },
        stringify: ({ classId, layout }) => ({ classId, layout }),
    },
    notFoundComponent: () => (
        <Navigate
            to="/$classId/$layout"
            params={{ classId: DEFAULT_CLASS_ID, layout: "nezekan" }}
            replace
        />
    ),
    component: BoardRoute,
})
