import { ClassPicker } from "@common/ClassPicker"
import type { BoardId } from "@config/boards"
import type { ClassId } from "@config/classPresets"
import { useNavigate } from "@tanstack/react-router"
import {
    readPlannerLocation,
    writePlannerLocation,
} from "./storage/plannerLocation"

type ClassSelectProps = {
    classId: ClassId
    layout?: BoardId
}

export const ClassSelect = ({ classId, layout }: ClassSelectProps) => {
    const navigate = useNavigate()

    const handleChange = (next: ClassId) => {
        if (layout) {
            navigate({
                to: "/planner/$classId/$layout",
                params: { classId: next, layout: layout },
                resetScroll: false,
            })

            return
        }

        writePlannerLocation({
            classId: next,
            layout: readPlannerLocation().layout,
        })
    }

    return (
        <ClassPicker
            value={classId}
            labelShown
            label="Class"
            onChange={handleChange}
        />
    )
}
