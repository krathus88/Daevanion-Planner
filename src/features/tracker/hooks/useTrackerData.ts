import { requestPersistentStorage } from "@planner/storage/persistStorage"
import type { EntriesLeft } from "@tracker/logic/taskEntries"
import {
    addCharacter,
    addTask,
    getRemovedPresets,
    getTasks,
    moveCharacter,
    moveTask,
    removeCharacter,
    removeTask,
    restorePreset,
    restoreStarterTasks,
    setCount,
    setEntries,
    setIgnored,
    setMinimized,
    updateCharacter,
    updateTask,
    type CharacterFields,
    type TaskFields,
} from "@tracker/logic/trackerEdits"
import {
    readTrackerData,
    subscribeToTrackerData,
    writeTrackerData,
} from "@tracker/storage/trackerData"
import type { TrackerTask } from "@tracker/types"
import { useSyncExternalStore } from "react"

export const useTrackerData = () => {
    const data = useSyncExternalStore(subscribeToTrackerData, readTrackerData)

    const changeCount = (
        owner: string,
        task: TrackerTask,
        period: number,
        count: number,
    ) => {
        writeTrackerData(
            setCount(readTrackerData(), owner, task, period, count),
        )
        requestPersistentStorage()
    }

    const changeEntries = (
        owner: string,
        task: TrackerTask,
        period: number,
        left: EntriesLeft,
    ) => {
        writeTrackerData(
            setEntries(readTrackerData(), owner, task, period, left),
        )
        requestPersistentStorage()
    }

    const createCharacter = (fields: CharacterFields) => {
        writeTrackerData(addCharacter(readTrackerData(), fields))
        requestPersistentStorage()
    }

    const changeCharacter = (id: string, changes: Partial<CharacterFields>) => {
        writeTrackerData(updateCharacter(readTrackerData(), id, changes))
    }

    const deleteCharacter = (id: string) => {
        writeTrackerData(removeCharacter(readTrackerData(), id))
    }

    const shiftCharacter = (id: string, targetId: string) => {
        writeTrackerData(moveCharacter(readTrackerData(), id, targetId))
    }

    const createTask = (fields: TaskFields) => {
        writeTrackerData(addTask(readTrackerData(), fields))
    }

    const changeTask = (id: string, fields: TaskFields) => {
        writeTrackerData(updateTask(readTrackerData(), id, fields))
    }

    const deleteTask = (id: string) => {
        writeTrackerData(removeTask(readTrackerData(), id))
    }

    const shiftTask = (id: string, targetId: string) => {
        writeTrackerData(moveTask(readTrackerData(), id, targetId))
    }

    const restoreTasks = () => {
        writeTrackerData(restoreStarterTasks(readTrackerData()))
    }

    const addPresetBack = (id: string) => {
        writeTrackerData(restorePreset(readTrackerData(), id))
    }

    const changeMinimized = (owners: readonly string[], minimized: boolean) => {
        writeTrackerData(setMinimized(readTrackerData(), owners, minimized))
    }

    const changeIgnored = (owner: string, taskId: string, ignored: boolean) => {
        writeTrackerData(setIgnored(readTrackerData(), owner, taskId, ignored))
    }

    const tasks = getTasks(data)

    return {
        characters: data.characters,
        tasks: tasks,
        counts: data.counts,
        entries: data.entries,
        minimized: data.minimized,
        ignored: data.ignored,
        usesStarterTasks: data.tasks === null,
        removedPresets: getRemovedPresets(data),
        changeMinimized: changeMinimized,
        changeIgnored: changeIgnored,
        changeCount: changeCount,
        changeEntries: changeEntries,
        createCharacter: createCharacter,
        changeCharacter: changeCharacter,
        deleteCharacter: deleteCharacter,
        shiftCharacter: shiftCharacter,
        createTask: createTask,
        changeTask: changeTask,
        deleteTask: deleteTask,
        shiftTask: shiftTask,
        restoreTasks: restoreTasks,
        addPresetBack: addPresetBack,
    }
}
