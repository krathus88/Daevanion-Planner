import {
    DEFAULT_CLASS_ID,
    isClassId,
    loadClassPreset,
} from "@config/classPresets"
import { BoardRoute } from "@planner/BoardRoute"
import { DEFAULT_BOARD_ID, isBoardId } from "@config/boards"
import { createFileRoute, Navigate, notFound } from "@tanstack/react-router"

export const Route = createFileRoute("/planner/$classId/$layout")({
    // Loaded with the app, not as a chunk: most URLs land here.
    codeSplitGroupings: [],
    params: {
        parse: ({ classId, layout }) => {
            if (!isClassId(classId) || !isBoardId(layout)) {
                throw notFound()
            }

            return { classId: classId, layout: layout }
        },
        stringify: ({ classId, layout }) => ({
            classId: classId,
            layout: layout,
        }),
    },
    validateSearch: (search: Record<string, unknown>): { share?: string } =>
        typeof search.share === "string" && search.share
            ? { share: search.share }
            : {},
    notFoundComponent: () => (
        <Navigate
            params={{ classId: DEFAULT_CLASS_ID, layout: DEFAULT_BOARD_ID }}
            replace
            to="/planner/$classId/$layout"
        />
    ),
    // Board rendering blocks the main thread; let the progress bar start first.
    beforeLoad: async ({ preload }) => {
        if (preload) return

        await new Promise(requestAnimationFrame)
        await Promise.all(
            document.getAnimations().map((animation) => animation.ready),
        )
    },
    loader: ({ params }) => loadClassPreset(params.classId),
    component: BoardRoute,
})
