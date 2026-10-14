import { DEFAULT_CLASS_ID, isClassId } from "@config/classPresets"
import { BoardRoute } from "@planner/BoardRoute"
import { DEFAULT_LAYOUT, isLayoutType } from "@planner/config/layouts"
import { createFileRoute, Navigate, notFound } from "@tanstack/react-router"

export const Route = createFileRoute("/planner/$classId/$layout")({
    // Most URLs land on the planner, so it loads with the app instead of as
    // a separate chunk fetched after it.
    codeSplitGroupings: [],
    params: {
        parse: ({ classId, layout }) => {
            if (!isClassId(classId) || !isLayoutType(layout)) {
                throw notFound()
            }

            return { classId: classId, layout: layout }
        },
        stringify: ({ classId, layout }) => ({
            classId: classId,
            layout: layout,
        }),
    },
    notFoundComponent: () => (
        <Navigate
            params={{ classId: DEFAULT_CLASS_ID, layout: DEFAULT_LAYOUT }}
            replace
            to="/planner/$classId/$layout"
        />
    ),
    // Rendering a board blocks the main thread. Wait a frame for the
    // navigation progress bar to mount, then for its animation to start,
    // otherwise it stays frozen until the board is done.
    beforeLoad: async ({ preload }) => {
        if (preload) return

        await new Promise(requestAnimationFrame)
        await Promise.all(
            document.getAnimations().map((animation) => animation.ready),
        )
    },
    component: BoardRoute,
})
