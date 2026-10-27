// Saved to the account. Undo steps, the last open board and which panels are
// open stay on the device.
export const PETS_KEY = "daevanion:pets:v1:collection"
export const TIMERS_KEY = "daevanion:timers:v1:settings"
const PLANNER_PREFIX = "daevanion:v1:"
const LOCAL_ONLY_SUFFIXES = [":board-undo", ":planner-undo"]

export const isPlannerKey = (key: string) => {
    return key.startsWith(PLANNER_PREFIX)
}

// Planner keys are `daevanion:v1:<class>:...`.
export const getPlannerClassId = (key: string) => {
    return key.slice(PLANNER_PREFIX.length).split(":")[0]
}

export const isSyncedKey = (key: string) => {
    if (key === PETS_KEY || key === TIMERS_KEY) {
        return true
    }

    if (!isPlannerKey(key)) {
        return false
    }

    for (const suffix of LOCAL_ONLY_SUFFIXES) {
        if (key.endsWith(suffix)) {
            return false
        }
    }

    return true
}
