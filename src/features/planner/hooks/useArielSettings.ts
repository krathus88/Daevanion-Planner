import { useEffect, useState } from "react"
import { errorMessage } from "@planner/logic/errorMessage"
import {
    DEFAULT_ARIEL_SETTINGS,
    readArielSettings,
    writeArielSettings,
    type ArielSettings,
} from "@planner/storage/arielSettings"
import { subscribeToClassSettings } from "@planner/storage/classSettings"

const readSettings = (classId: string) => {
    try {
        return { settings: readArielSettings(classId), error: null }
    } catch (error) {
        return {
            settings: DEFAULT_ARIEL_SETTINGS,
            error: errorMessage(error, "Could not read Ariel settings."),
        }
    }
}

// Ariel's points and stat tiers, shared by the Ariel board and the All
// boards tab.
export const useArielSettings = (classId: string) => {
    const [initial] = useState(() => readSettings(classId))
    const [settings, setSettings] = useState(initial.settings)
    const [error, setError] = useState<string | null>(initial.error)

    useEffect(
        () =>
            subscribeToClassSettings(classId, () => {
                const next = readSettings(classId)
                setSettings(next.settings)
                setError(next.error)
            }),
        [classId],
    )

    const update = (next: ArielSettings) => {
        const writeError = writeArielSettings(classId, next)
        if (writeError) {
            setError(writeError)
            return writeError
        }

        setSettings(next)
        setError(null)
        return null
    }

    return { settings: settings, error: error, update: update }
}
