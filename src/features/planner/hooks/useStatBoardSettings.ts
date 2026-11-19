import { useEffect, useState } from "react"
import { BOARD_NAMES, type StatBoardId } from "@config/boards"
import { errorMessage } from "@planner/logic/errorMessage"
import { subscribeToClassSettings } from "@planner/storage/classSettings"
import {
    DEFAULT_STAT_BOARD_SETTINGS,
    readStatBoardSettings,
    writeStatBoardSettings,
    type StatBoardSettings,
} from "@planner/storage/statBoardSettings"

const readSettings = (classId: string, board: StatBoardId) => {
    try {
        return { settings: readStatBoardSettings(classId, board), error: null }
    } catch (error) {
        return {
            settings: DEFAULT_STAT_BOARD_SETTINGS[board],
            error: errorMessage(
                error,
                `Could not read ${BOARD_NAMES[board]} settings.`,
            ),
        }
    }
}

// Ariel's or Azphel's settings.
export const useStatBoardSettings = (classId: string, board: StatBoardId) => {
    const [state, setState] = useState(() => ({
        key: `${classId}:${board}`,
        ...readSettings(classId, board),
    }))

    // A board switch reads the other board's settings at once.
    const key = `${classId}:${board}`
    const current =
        state.key === key ? state : { key, ...readSettings(classId, board) }
    if (current !== state) {
        setState(current)
    }

    useEffect(
        () =>
            subscribeToClassSettings(classId, () => {
                setState({ key, ...readSettings(classId, board) })
            }),
        [classId, board, key],
    )

    const update = (next: StatBoardSettings) => {
        const writeError = writeStatBoardSettings(classId, board, next)
        if (writeError) {
            setState({ ...current, error: writeError })
            return writeError
        }

        setState({ key, settings: next, error: null })
        return null
    }

    return { settings: current.settings, error: current.error, update: update }
}
