import { getPlayingClass } from "@account/game/playingCharacter"
import { useCompanionStatus } from "@account/hooks/useCompanionStatus"
import type { ClassId } from "@config/classPresets"
import {
    readPlannerLocation,
    writePlannerLocation,
} from "@planner/storage/plannerLocation"
import { useEffect, useEffectEvent } from "react"

// The header's class follows the character the companion app sees being
// played, once per character change, but never on the planner page: there
// the class is the board being worked on. A pick made by hand stays until
// the next character.
export const useFollowPlayedClass = (onPlanner: boolean) => {
    const playing = getPlayingClass(useCompanionStatus())
    const who = playing?.who ?? null
    const classId = playing?.classId ?? null

    const follow = useEffectEvent((next: ClassId) => {
        const location = readPlannerLocation()

        if (!onPlanner && location.classId !== next) {
            writePlannerLocation({ ...location, classId: next })
        }
    })

    useEffect(() => {
        if (who !== null && classId !== null) {
            follow(classId)
        }
    }, [who, classId])
}
