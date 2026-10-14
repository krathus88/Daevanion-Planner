import {
    readPlannerLocation,
    subscribeToPlannerLocation,
} from "@planner/storage/plannerLocation"
import { useSyncExternalStore } from "react"

export const usePlannerLocation = () => {
    return useSyncExternalStore(subscribeToPlannerLocation, readPlannerLocation)
}
