import { useState } from "react"
import { errorMessage } from "@planner/logic/errorMessage"
import {
    DEFAULT_STAT_SETTINGS,
    readStatSettings,
    writeStatSettings,
    type StatSettings,
} from "@planner/storage/statPriorities"

const readInitialSettings = (classId: string) => {
    try {
        return { settings: readStatSettings(classId), error: null }
    } catch (error) {
        return {
            settings: DEFAULT_STAT_SETTINGS,
            error: errorMessage(error, "Could not read stat priorities."),
        }
    }
}

// The class's stat tiers and whether leftover points go to stats.
export const useStatSettings = (classId: string) => {
    const [initial] = useState(() => readInitialSettings(classId))
    const [settings, setSettings] = useState(initial.settings)
    const [error, setError] = useState<string | null>(initial.error)

    const update = (next: StatSettings) => {
        const writeError = writeStatSettings(classId, next)
        if (writeError) {
            setError(writeError)
            return
        }

        setSettings(next)
        setError(null)
    }

    return { settings: settings, error: error, update: update }
}
