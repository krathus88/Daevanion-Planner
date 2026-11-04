import { createFileRoute } from "@tanstack/react-router"
import { TrackerPage } from "@tracker/TrackerPage"

export const Route = createFileRoute("/tracker")({
    component: TrackerPage,
})
