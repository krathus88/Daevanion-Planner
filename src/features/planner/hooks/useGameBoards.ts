import { GAME_CLASSES } from "@account/game/gameIds"
import {
    readGameBoards,
    subscribeToGameSnapshots,
} from "@account/game/gameSync"
import { useCompanionStatus } from "@account/hooks/useCompanionStatus"
import type { ClassId } from "@config/classPresets/classInfo"
import { useSyncExternalStore } from "react"

// While the companion app runs: the characters of this class whose
// Daevanion boards it has sent, the one being played first.
export const useGameBoards = (classId: ClassId) => {
    const status = useCompanionStatus()
    const all = useSyncExternalStore(subscribeToGameSnapshots, readGameBoards)

    if (status.state !== "running") {
        return []
    }

    const playing = status.character
    const isPlaying = (name: string, server: number) => {
        return playing?.name === name && playing.server === server
    }
    const characters = all.filter((character) => {
        return GAME_CLASSES[character.class] === classId
    })

    return characters.sort((a, b) => {
        return (
            Number(isPlaying(b.name, b.server)) -
            Number(isPlaying(a.name, a.server))
        )
    })
}
